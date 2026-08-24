#!/bin/bash
# Tạo nhiều database trong một container Postgres.
# Mỗi microservice sở hữu DATABASE RIÊNG — không service nào đọc DB của service khác.
set -e

for db in $(echo "$POSTGRES_MULTIPLE_DATABASES" | tr ',' ' '); do
  echo "Đang tạo database: $db"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-SQL
      CREATE DATABASE $db;
      GRANT ALL PRIVILEGES ON DATABASE $db TO $POSTGRES_USER;
SQL
done
