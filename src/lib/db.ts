export async function query(text: string, params?: any[]) {
  return { rows: [], rowCount: 0 };
}

const pool = {
  query: async (text: string, params?: any[]) => ({ rows: [], rowCount: 0 }),
  on: () => {},
};

export default pool;
