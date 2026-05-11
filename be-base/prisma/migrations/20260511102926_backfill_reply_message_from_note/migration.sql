-- Backfill replyMessage from note for historical RESPONDED contacts.
-- Before this change, Contact.reply() wrote the reply body into `note`.

UPDATE "contacts"
SET "replyMessage" = "note"
WHERE "status" = 'RESPONDED' AND "note" IS NOT NULL;

UPDATE "contacts"
SET "note" = NULL
WHERE "status" = 'RESPONDED';
