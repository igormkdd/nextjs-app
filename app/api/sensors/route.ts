import { withAuth } from '@/app/lib/auth';
import { InfluxDB } from '@influxdata/influxdb-client';
import { NextResponse } from 'next/server';

const influxDB = new InfluxDB({
    url: process.env.INFLUX_URL!,
    token: process.env.INFLUX_TOKEN!
});

export const GET = withAuth(async () => {
    const queryApi = influxDB.getQueryApi(process.env.INFLUX_ORG!);

    const fluxQuery = `
    from(bucket: "${process.env.INFLUX_BUCKET}")
      |> range(start: -24h)
      |> filter(fn: (r) => r._measurement == "TempAndHum")
      |> filter(fn: (r) => r._field == "SHT40-temp" or r._field == "SHT40-hum")
      |> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 100)
  `;

    const records: any[] = [];

    return new Promise((resolve) => {
        queryApi.queryRows(fluxQuery, {
            next(row, tableMeta) {
                const data = tableMeta.toObject(row);
                records.push({
                    timestamp: data._time,
                    temperature: data["SHT40-temp"],
                    humidity: data["SHT40-hum"],
                });
            },
            complete() {
                resolve(
                    new NextResponse(JSON.stringify(records), {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    })
                );
            },
            error(error) {
                console.error(error);
                resolve(
                    new NextResponse(JSON.stringify({ error: "Failed to fetch sensor data" }), {
                        status: 500,
                    })
                );
            },
        });
    });
});
