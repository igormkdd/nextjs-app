import { Footer } from "./components/Footer";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Sensors API</h1>

        <p>Device: <strong>ESP32C6 Zero</strong></p>
        <p>Sensor: <strong>SHT40</strong></p>
      </main>

      <Footer />
    </div>
  );
}
