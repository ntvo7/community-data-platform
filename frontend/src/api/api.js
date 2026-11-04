// This file contains all API calls to the API endpoints
// import axios to make API calls
import axios from "axios";

// Create HTTP client with the base URL, and specify that the data sent in the request body is JSON
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_ROOT_API,
  headers: {
    "Content-Type": "application/json",
  },
});

// Retry GET requests that got no response, e.g. while the backend is still starting up
const MAX_GET_RETRIES = 3;
const GET_RETRY_DELAY_MS = 1000;

apiClient.interceptors.response.use(undefined, async (error) => {
  // A saved token the server no longer accepts: clear it and ask the user to log in again
  if (error.response?.status === 401 && localStorage.getItem("authToken")) {
    logoutUser();
    window.location.assign("/login");
    throw error;
  }

  const config = error.config;
  // Only retry when there is no response. A response means the server made a decision.
  if (!config || error.response || config.method !== "get") throw error;

  config.retryCount = (config.retryCount || 0) + 1;
  if (config.retryCount > MAX_GET_RETRIES) throw error;

  await new Promise((resolve) => setTimeout(resolve, GET_RETRY_DELAY_MS));
  return apiClient(config);
});

// Login related API calls
// If user logs in successfully, this login sets a header to "apiClient" called "Authorization" with the value of "Bearer <token>" This security token is used to validate API calls
function setAuthHeader(token) {
  apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// When the app starts, this function puts a saved token back on apiClient and returns it
export function restoreAuthToken() {
  const token = localStorage.getItem("authToken");
  if (token) setAuthHeader(token);
  return token;
}

// When user logs out, this function removes the Authorization header from apiClient
function removeAuthHeader() {
  delete apiClient.defaults.headers.common["Authorization"];
}

// Gets a message to show the user from a failed API call. The backend sends errors as text or
// as { message }, and when the server cannot be reached there is no response at all.
function getErrorMessage(error) {
  const data = error.response?.data;
  if (typeof data === "string" && data) return data;
  if (data?.message) return data.message;
  return error.response ? error.message : "Unable to reach the server. Please try again.";
}

// API call to log the user in
export async function loginUser(username, password) {
  try {
    const response = await apiClient.post("/users/login", {
      username,
      password,
    });
    const token = response.data.token;
    localStorage.setItem("authToken", token);
    setAuthHeader(token);
    return token;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// API call to log the user out
export function logoutUser() {
  localStorage.removeItem("authToken");
  removeAuthHeader();
}

// Org related API calls
// API call to get org name
export async function getOrgName() {
  const response = await apiClient.get(`/org`);
  return response.data;
}

// Events related API calls
// API call to get all events for org
export const getEvents = async () => {
  try {
    const response = await apiClient.get("/events/");
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to GET single event by ID
export const getEventById = async (id) => {
  try {
    const response = await apiClient.get(`/events/id/${id}`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to GET events based on search query
export const searchEvents = async (query) => {
  try {
    let params = {};
    if (query.searchBy === "name") {
      params.searchBy = query.searchBy;
      params.name = query.name || "";
    } else if (query.searchBy === "date") {
      params.searchBy = "date";
      params.eventDate = query.eventDate || "";
    }
    const response = await apiClient.get(`/events/search`, {
      params: params,
    });
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to GET events for which a client is signed up
export const getClientEvents = async (id) => {
  try {
    const response = await apiClient.get(`/events/client/${id}`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to GET events for which a client is not signed up
export const getNonClientEvents = async (id) => {
  try {
    const response = await apiClient.get(`/events/client/${id}/not-registered`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to GET all attendees for an event
export const getEventAttendees = async (id) => {
  try {
    const response = await apiClient.get(`/events/attendees/${id}`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to GET all events for a given service
export const getEventsByServiceId = async (id) => {
  try {
    const response = await apiClient.get(`/events/service/${id}`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to POST new event
export const createEvent = async (eventData) => {
  try {
    const response = await apiClient.post("/events/", eventData);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to PUT update event
export const updateEvent = async (id, eventData) => {
  try {
    const response = await apiClient.put(`/events/update/${id}`, eventData);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to PUT add attendee to event
export const registerAttendee = async (eventId, clientId) => {
  try {
    const response = await apiClient.put(
      `/events/register`,
      {},
      {
        params: {
          event: eventId,
          client: clientId,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to PUT remove attendee from event
export const deregisterAttendee = async (eventId, clientId) => {
  try {
    const response = await apiClient.put(
      `/events/deregister`,
      {},
      {
        params: {
          event: eventId,
          client: clientId,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to DELETE event by ID
export const deleteEvent = async (id) => {
  try {
    const response = await apiClient.delete(`/events/${id}`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to get events for last two month for dashboard
export const getAttendance = async () => {
  try {
    const response = await apiClient.get("/events/attendance");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Clients related API calls
// API call to GET all clients for org
export const getClients = async () => {
  try {
    const response = await apiClient.get("clients");
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to GET single client by ID
export const getClientById = async (id) => {
  try {
    const response = await apiClient.get(`/clients/id/${id}`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to GET entries based on search query
export const searchClients = async (query) => {
  try {
    let params = {};
    if (query.searchBy === "name") {
      params.searchBy = query.searchBy;
      params.firstName = query.firstName || "";
      params.lastName = query.lastName || "";
    } else if (query.searchBy === "number") {
      params.searchBy = query.searchBy;
      params.phoneNumber = query.phoneNumber || "";
    }
    const response = await apiClient.get("/clients/search", {
      params: params,
    });
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to POST new client
export const createClient = async (newClient) => {
  try {
    const response = await apiClient.post("/clients", newClient);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to PUT update client
export const updateClient = async (id, updatedClient) => {
  try {
    const response = await apiClient.put(
      `/clients/update/${id}`,
      updatedClient
    );
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to delete client
export const deleteClientbyId = async (id) => {
  try {
    const response = await apiClient.delete(`/clients/${id}`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to get events for dashboard
export const getClientsByZipCode = async () => {
  try {
    const response = await apiClient.get("/clients/byzip");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// API calls related to services
// API call to get all services for org
export const getServices = async () => {
  try {
    const response = await apiClient.get("/services/");
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to GET single service by ID
export const getServiceById = async (id) => {
  try {
    const response = await apiClient.get(`/services/id/${id}`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to GET services based on search query
export const searchServices = async (query) => {
  try {
    let params = {};
    params.searchBy = query.searchBy;
    if (query.searchBy === "name") {
      params.name = query.name || "";
    } else if (query.searchBy === "description") {
      params.description = query.description;
    }
    const response = await apiClient.get("/services/search", {
      params: params,
    });
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to POST new service
export const createService = async (newService) => {
  try {
    const response = await apiClient.post("/services", newService);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to PUT update service
export const updateService = async (id, updatedService) => {
  try {
    const response = await apiClient.put(
      `/services/update/${id}`,
      updatedService
    );
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};

// API call to DELETE service by ID
export const deleteService = async (id) => {
  try {
    const response = await apiClient.delete(`/services/${id}`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error);
  }
};
