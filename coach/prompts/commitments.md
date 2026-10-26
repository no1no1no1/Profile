Use Gmail to read messages SENT by the user in the last 2 hours. Find promises he made
("I'll", "I will", "will send", "by Friday", "let me get back to you").
Skip anything already in context.known. Reply ONLY with a JSON array:
[{"what": "send deck to Marco", "to": "marco@x.com", "due": "2026-10-30T17:00:00Z or null", "source": "email subject"}]
Return [] if none.
