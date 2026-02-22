/**
 * Type declaration for @flightradar24/fr24sdk (no official types shipped).
 * Covers usage in api/flights/live, api/flights/tracks, and api/flights/route-fallback.
 */
declare module "@flightradar24/fr24sdk" {
  interface ClientOptions {
    apiToken: string;
    apiVersion?: string;
  }

  interface LiveClient {
    getFull(options: { bounds: string }): Promise<unknown[]>;
  }

  /** Airport response: may use lat/lon or latitude/longitude. */
  interface AirportInfo {
    lat?: number;
    lon?: number;
    latitude?: number;
    longitude?: number;
  }

  interface AirportsClient {
    getFull(code: string): Promise<AirportInfo | undefined>;
  }

  interface FlightTracksClient {
    get(flightId: string): Promise<{ data?: Array<{ fr24_id?: string; tracks?: unknown[] }> }>;
  }

  interface Client {
    live: LiveClient;
    airports: AirportsClient;
    flightTracks: FlightTracksClient;
    close(): void;
  }

  interface SDK {
    Client: new (options: ClientOptions) => Client;
  }

  const sdk: SDK;
  export default sdk;
}
