// Init replica set mono-nœud (Docker). Idempotent.
try {
  const status = rs.status();
  print('Replica set already initialized: ' + status.set);
} catch (e) {
  print('Initiating rs0...');
  rs.initiate({
    _id: 'rs0',
    members: [{ _id: 0, host: 'mongo:27017' }],
  });
  print('rs0 initiated');
}
