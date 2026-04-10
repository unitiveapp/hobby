const Mapbox = {
  setAccessToken: vi.fn(),
  Camera: class Camera {
    flyTo = vi.fn();
    setCamera = vi.fn();
    fitBounds = vi.fn();
  },
};

export default Mapbox;
