export default function SensorCard({ nilai, status }: any) {

  let color = "gray"

  if (status === "Basah") color = "green"
  if (status === "Normal") color = "orange"
  if (status === "Kering") color = "red"

  return (
    <div style={{
      border:"1px solid #ddd",
      padding:"20px",
      borderRadius:"10px",
      marginBottom:"10px"
    }}>
      <h3>Sensor Tanah</h3>
      <p>Nilai: {nilai}</p>
      <p style={{color}}>Status: {status}</p>
    </div>
  )
}