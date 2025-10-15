#!/bin/bash
find src -name "*.ts" -type f -exec sed -i.bak 's/catch (error)/catch (error: unknown)/g' {} \;
