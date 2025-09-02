# create-test-environment.sh
#!/bin/bash

# Create docker-compose file
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  metabase:
    image: metabase/metabase:latest
    container_name: metabase-test
    ports:
      - "3000:3000"
    environment:
      MB_DB_TYPE: postgres
      MB_DB_DBNAME: metabase
      MB_DB_PORT: 5432
      MB_DB_USER: metabase
      MB_DB_PASS: password
      MB_DB_HOST: postgres
    depends_on:
      - postgres
    networks:
      - metabase-net

  postgres:
    image: postgres:13
    container_name: postgres-test
    environment:
      POSTGRES_DB: metabase
      POSTGRES_USER: metabase
      POSTGRES_PASSWORD: password
    networks:
      - metabase-net

networks:
  metabase-net:
    driver: bridge
EOF

# Start the environment
docker-compose up -d

# Wait for containers to start
sleep 10

# Test DNS resolution from within Metabase container
echo "Testing DNS resolution from Metabase container:"
docker exec metabase-test nslookup postgres

echo "Testing Java DNS resolution from Metabase container:"
docker exec metabase-test bash -c "
cat > /tmp/TestDNS.java << 'JAVAEOF'
import java.net.InetAddress;
public class TestDNS {
    public static void main(String[] args) throws Exception {
        InetAddress[] addresses = InetAddress.getAllByName(\"postgres\");
        System.out.println(\"Resolved: \");
        for (InetAddress addr : addresses) {
            System.out.println(\"  \" + addr.getHostAddress());
        }
    }
}
JAVAEOF
javac /tmp/TestDNS.java && java -cp /tmp TestDNS
"

# Check Metabase logs
echo "Metabase logs:"
docker logs metabase-test