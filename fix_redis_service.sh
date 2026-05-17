#!/bin/bash

echo "🔧 Fixing RedisService static disconnect method..."

# First, let's find the exact line number where ping method ends
PING_END_LINE=$(grep -n "return RedisService.getInstance().ping();" src/services/redis.service.ts | cut -d: -f1)
NEXT_LINE=$((PING_END_LINE + 2))

# Create a temporary file with the disconnect method
cat > /tmp/disconnect_method.txt << 'DISCONNECT_EOF'

  public static async disconnect(): Promise<void> {
    return RedisService.getInstance().disconnect();
  }
DISCONNECT_EOF

# Insert the disconnect method after the ping method
sed -i '' "${NEXT_LINE}r /tmp/disconnect_method.txt" src/services/redis.service.ts

# Clean up temp file
rm /tmp/disconnect_method.txt

echo "✅ RedisService disconnect method added!"
