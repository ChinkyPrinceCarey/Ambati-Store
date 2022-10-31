@echo off

set host="localhost"
set user="root"
set password=
set db_name="u916003822_ambati"
mysqldump --no-data --skip-comments --host=%host% -u %user% --password=%password% %db_name% > %db_name%.sql