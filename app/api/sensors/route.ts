import { InfluxDB } from '@influxdata/influxdb-client';

const influxDB = new InfluxDB({
    url: process.env.INFLUX_URL!,
    token: process.env.INFLUX_TOKEN!
});

export async function GET() {
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
                    humidity: data["SHT40-hum"]
                });
            },
            complete() {
                resolve(new Response(JSON.stringify(records), { status: 200 }));
            },
            error(error) {
                console.error(error);
                resolve(new Response(JSON.stringify({ error: 'Failed to fetch sensor data' }), { status: 500 }));
            },
        });
    });
}
