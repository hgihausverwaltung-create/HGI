-- AlterTable
ALTER TABLE "templates"
ADD COLUMN     "emailSubjectTemplate" TEXT NOT NULL DEFAULT '{{draftTitle}}',
ADD COLUMN     "emailBodyTemplate" TEXT NOT NULL DEFAULT 'Im Anhang finden Sie das Protokoll "{{draftTitle}}".';
