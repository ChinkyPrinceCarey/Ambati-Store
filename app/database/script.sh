#!/bin/bash

host="localhost"
user="u916003822_mickey_beta"
password="123@Passwordtrue"
db_name="u916003822_ambati_beta"

mysqldump --no-data --skip-comments --host=$host -u $user --password=$password $db_name > $db_name.sql