import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const userHeader = req.headers.get('x-user');
    const user = userHeader ? JSON.parse(userHeader) : null;

    if (!user) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    return new NextResponse(
        JSON.stringify({
            message: 'Welcome to Admin area',
            user
        }),
        { status: 200 }
    );
}
