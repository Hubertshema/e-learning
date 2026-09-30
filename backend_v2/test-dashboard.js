import 'dotenv/config';
import { StudentController } from './src/controllers/student.controller.js';

async function main() {
  const req = {
    user: { id: 'ca6a0db0-be81-4c4b-bb1b-3bdc92ca18b3' },
  };
  const res = {
    json: (data) => console.log(JSON.stringify(data, null, 2)),
    status: (code) => {
      console.log('Status:', code);
      return res;
    }
  };
  
  await StudentController.getDashboard(req, res);
  process.exit(0);
}

main().catch(console.error);
