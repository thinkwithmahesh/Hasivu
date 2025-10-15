#!/bin/bash
find src -name "*.ts" -type f -exec sed -i.bak 's/\.map(row =>/\.map((row: any) =>/g' {} \;
find src -name "*.ts" -type f -exec sed -i.bak 's/\.map(item =>/\.map((item: any) =>/g' {} \;
