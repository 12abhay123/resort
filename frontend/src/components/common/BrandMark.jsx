import logo from '../../../img/logo.png';

export default function BrandMark({ size = 96 }) {
  return (
    <img
      src={logo}
      alt="Staylix"
      className="inline-block h-auto shrink-0 object-contain"
      style={{ height: size, width: Math.round(size * 677 / 369) }}
    />
  );
}