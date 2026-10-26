/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import api, { clearToken, getToken } from "@/lib/api";
import { fetchSites } from "@/lib/analytics";

const SiteContext = createContext(null);
const SITE_KEY = "kloudspot.siteId";

export function SiteProvider({ children }) {
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState(
    () => sessionStorage.getItem(SITE_KEY) || "",
  );
  const [sitesError, setSitesError] = useState("");
  const [liveBySite, setLiveBySite] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetchSites()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setSites(list);
        setSiteId((current) => {
          if (current && list.some((site) => site.siteId === current))
            return current;
          return list[0]?.siteId || "";
        });
      })
      .catch(() => {
        if (active) setSitesError("errors.sites");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (siteId) sessionStorage.setItem(SITE_KEY, siteId);
  }, [siteId]);

  useEffect(() => {
    const token = getToken();
    if (!token) return undefined;

    const socket = io(api.defaults.baseURL, {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("alert", (event) => {
      if (!event?.personName && !event?.eventId) return;
      const id =
        event.eventId || `${event.ts}-${event.personId}-${event.direction}`;
      setAlerts((current) => {
        if (current.some((item) => item.id === id)) return current;
        return [{ id, ...event }, ...current].slice(0, 40);
      });
    });

    socket.on("live_occupancy", (event) => {
      if (!event?.siteId) return;
      setLiveBySite((current) => ({
        ...current,
        [event.siteId]: {
          occupancy: event.siteOccupancy,
          male: event.genderCount?.male ?? 0,
          female: event.genderCount?.female ?? 0,
        },
      }));
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, []);

  const logout = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    clearToken();
  }, []);

  const site = sites.find((item) => item.siteId === siteId) || null;
  const value = useMemo(
    () => ({
      sites,
      site,
      siteId,
      setSiteId,
      sitesError,
      liveOccupancy: site ? liveBySite[site.siteId]?.occupancy : undefined,
      liveGender: site ? liveBySite[site.siteId] : undefined,
      alerts,
      selectedDate,
      setSelectedDate,
      logout,
    }),
    [sites, site, siteId, sitesError, liveBySite, alerts, selectedDate, logout],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error("useSite must be used inside SiteProvider");
  }
  return context;
}
