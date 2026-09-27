@echo off
set PGPASSWORD=Abder@2002
psql -U postgres -d sms_academic_db -f c:\school_management\alter_marks.sql
