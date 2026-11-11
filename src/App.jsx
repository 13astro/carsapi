import VinDecoder from './VinDecoder.jsx';
import VehicleFilter from './VehicleFilter.jsx';
import PopularMakesFilter from './PopularMakesFilter.jsx';

export default function App() {
  return (
    <div className="app">
      <h1>Vehicle Lookup</h1>
      <p className="subtitle">
        Decode a VIN or filter by make and model — powered by the NHTSA vPIC API.
      </p>
      <VinDecoder />
      <VehicleFilter />
      <PopularMakesFilter />
    </div>
  );
}