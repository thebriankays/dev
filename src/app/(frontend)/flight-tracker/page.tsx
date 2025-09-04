import FlightTrackerClient from './FlightTrackerClient'

export default function FlightTrackerPage() {
  return (
    <FlightTrackerClient
      enableSearch={true}
      enableGeolocation={true}
      defaultLocation={{ lat: 40.7128, lng: -74.0060 }} // Default to NYC
      searchRadius={2}
    />
  )
}

export const metadata = {
  title: 'Live Flight Tracker - Real-time Aircraft Tracking',
  description: 'Track flights in real-time with our live flight tracker. View aircraft positions, flight details, gates, and more.',
}