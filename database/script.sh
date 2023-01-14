#!/bin/bash

host="localhost"
user="root"
password=
db_name="u916003822_ambati"

mysqldump --no-data --skip-comments --host=$host -u $user --password=$password $db_name > $db_name.sql