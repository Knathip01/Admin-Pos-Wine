export async function query(text: string, params?: any[]): Promise<{ rows: any[]; rowCount: number }> {
  return { rows: [], rowCount: 0 };
}

const pool = {
  query: async (text: string, params?: any[]): Promise<{ rows: any[]; rowCount: number }> => ({ rows: [], rowCount: 0 }),
  on: () => {},
};

export default pool;
