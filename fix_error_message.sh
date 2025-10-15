#!/bin/bash
find src -name "*.ts" -type f -exec sed -i.bak 's/error: error\.message/error: error instanceof Error ? error.message : String(error)/g' {} \;
