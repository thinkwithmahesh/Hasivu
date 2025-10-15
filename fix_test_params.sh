#!/bin/bash
find src -name "*.ts" -type f -exec sed -i.bak 's/(req, res)/(req: Request, res: Response)/g' {} \;
