#!/usr/bin/env python3
"""Pull recent Garmin Connect stats and write them to data/garmin.json.

Uses the unofficial `garminconnect` library — Garmin has no public API for
individual developers, so this logs in with a real Garmin Connect account
(credentials come from GARMIN_EMAIL / GARMIN_PASSWORD env vars).

Field names come from Garmin Connect's undocumented internal API and can
shift without notice; each fetch below is best-effort and falls back to
None/empty rather than failing the whole run.
"""
import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path

from garminconnect import Garmin

OUT_PATH = Path(__file__).resolve().parent.parent / "data" / "garmin.json"


def safe(fn, default=None):
    try:
        return fn()
    except Exception as exc:  # noqa: BLE001 - best-effort per-field fetch
        print(f"warning: {fn.__name__ if hasattr(fn, '__name__') else fn} failed: {exc}", file=sys.stderr)
        return default


def main():
    email = os.environ["GARMIN_EMAIL"]
    password = os.environ["GARMIN_PASSWORD"]

    client = Garmin(email, password)
    client.login()

    today = date.today().isoformat()

    stats = safe(lambda: client.get_stats(today)) or {}
    sleep = safe(lambda: client.get_sleep_data(today)) or {}
    max_metrics = safe(lambda: client.get_max_metrics(today)) or []
    training_status = safe(lambda: client.get_training_status(today)) or {}
    activities = safe(lambda: client.get_activities(0, 5)) or []

    month_ago = (date.today() - timedelta(days=30)).isoformat()
    activities_month = safe(lambda: client.get_activities_by_date(month_ago, today)) or []

    vo2max = None
    if isinstance(max_metrics, list) and max_metrics:
        generic = max_metrics[0].get("generic", {}) or {}
        vo2max = generic.get("vo2MaxPreciseValue") or generic.get("vo2MaxValue")

    sleep_summary = (sleep or {}).get("dailySleepDTO") or {}
    sleep_seconds = sleep_summary.get("sleepTimeSeconds")

    runs = []
    for a in activities_month:
        type_key = (a.get("activityType") or {}).get("typeKey") or ""
        if "running" not in type_key:
            continue
        distance_km = round(a["distance"] / 1000, 2) if a.get("distance") else None
        duration_min = round(a["duration"] / 60, 1) if a.get("duration") else None
        pace_min_per_km = round(duration_min / distance_km, 2) if duration_min and distance_km else None
        runs.append({
            "name": a.get("activityName"),
            "type": type_key,
            "date": a.get("startTimeLocal"),
            "distance_km": distance_km,
            "duration_min": duration_min,
            "pace_min_per_km": pace_min_per_km,
        })
    runs.sort(key=lambda r: r["date"] or "")

    data = {
        "updated_at": today,
        "daily": {
            "steps": stats.get("totalSteps"),
            "resting_hr": stats.get("restingHeartRate"),
            "sleep_hours": round(sleep_seconds / 3600, 1) if sleep_seconds else None,
        },
        "vo2max": vo2max,
        "training_status": training_status if isinstance(training_status, dict) and training_status else None,
        "recent_activities": [
            {
                "name": a.get("activityName"),
                "type": (a.get("activityType") or {}).get("typeKey"),
                "date": a.get("startTimeLocal"),
                "distance_km": round(a["distance"] / 1000, 2) if a.get("distance") else None,
                "duration_min": round(a["duration"] / 60, 1) if a.get("duration") else None,
            }
            for a in activities
        ],
        "runs_last_30_days": runs,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(data, indent=2))
    print(f"wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
