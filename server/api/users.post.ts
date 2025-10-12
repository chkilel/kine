export default defineEventHandler(async(event)=>{

    const requestBody = await readBody(event);

    const db = useDB();

    const result = await db.sql`INSERT INTO users (name,email) VALUES (${requestBody.name},${requestBody.email})`;
    return result;
});