from datetime import datetime


def escape_ics(text: str) -> str:
    return text.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n")


def generate_reading_plan_ics(book_title: str, sessions: list[dict]) -> str:
    now = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//BookTwin//Reading Plan//EN",
        "CALSCALE:GREGORIAN",
    ]
    for i, item in enumerate(sessions):
        date = str(item["date"]).replace("-", "")
        uid = f"booktwin-{date}-{i}@booktwin.local"
        summary = escape_ics(f"Read {book_title}: pp. {item['pages_start']}-{item['pages_end']}")
        description = escape_ics(item.get("note", "BookTwin reading session"))
        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{now}",
            f"DTSTART;VALUE=DATE:{date}",
            f"DTEND;VALUE=DATE:{date}",
            f"SUMMARY:{summary}",
            f"DESCRIPTION:{description}",
            "END:VEVENT",
        ])
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"
