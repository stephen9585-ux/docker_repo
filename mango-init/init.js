// This script runs once on first startup inside the 'level1_db' database
// because MONGO_INITDB_DATABASE is set to 'level1_db' in docker-compose.yml

db.createUser({
  user: "appServer",
  pwd: "password123",
  roles: [
    { role: "readWrite", db: "level1_db" }
  ]
});

print("✅ MongoDB user 'appServer' created for database 'level1_db'");

// Create the collection and insert a sample document to initialise it
db.users.insertOne({
  username: "system_init",
  password: "init",
  createdAt: new Date()
});

print("✅ Collection 'users' initialised.");
