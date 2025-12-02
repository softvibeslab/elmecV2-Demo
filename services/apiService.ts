import axios from 'axios';
import { URLs } from '../constants/commons';
import { AgentList, dataChats } from '../constants/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../components/api';

export const registerUser = async (userData: any) => {
  try {
    const response = await api.post(
      URLs.BASE + URLs.REGISTER_CUSTOMER,
      userData
    );
    if (response.status === 201) {
      return { data: response.data, status: true }; // El registro fue exitoso
    }
    return { data: null, status: true }; // El registro no fue exitoso
  } catch (error) {
    throw error; // Manejo de errores
  }
};

export const registerUserAdmin = async (token: string, userData: any) => {
  try {
    const response = await api.post(URLs.BASE + URLs.REGISTER, userData, {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    if (response.status === 201) {
      return { data: response.data, status: true }; // El registro fue exitoso
    }
    return { data: null, status: true }; // El registro no fue exitoso
  } catch (error) {
    throw error; // Manejo de errores
  }
};

export const partialUpdateAdmin = async (
  id: number,
  token: string,
  userData: any
) => {
  try {
    const response = await api.patch(
      URLs.BASE + URLs.USER_ADMIN_PARTIAL_UPDATE + id,
      userData,
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );
    if (response.status === 200) {
      return { data: response.data, status: true }; // El registro fue exitoso
    }
    return { data: null, status: false }; // El registro fue exitoso
  } catch (error) {
    throw error; // Manejo de errores
  }
};

export const partialUpdateAdminByForm = async (
  token: string,
  userData: any,
  imageFile: File | null
) => {
  try {
    const formData = new FormData();

    // Añade los datos de usuario a FormData
    for (const key in userData) {
      if (userData.hasOwnProperty(key)) {
        formData.append(key, userData[key]);
      }
    }

    // Añade el archivo de imagen a FormData
    if (imageFile) {
      formData.append('foto', imageFile);
    }

    const response = await api.patch(
      URLs.BASE + URLs.USER_PARTIAL_UPDATE,
      formData,
      {
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    if (response.status === 201) {
      return { data: response.data, status: true }; // El registro fue exitoso
    }
    return { data: null, status: false }; // El registro fue exitoso
  } catch (error) {
    throw error; // Manejo de errores
  }
};

export const setNewMessageByForm = async (
  token: string,
  userData: any,
  imageFile: File | null
) => {
  // Verifica si el token es nulo o vacío
  if (!token) {
    // Obtén el token almacenado en AsyncStorage
    const storedToken = await AsyncStorage.getItem('token');
    if (storedToken) {
      token = storedToken;
    } else {
      throw new Error('No token available');
    }
  }

  try {
    const formData = new FormData();

    // Añade los datos de usuario a FormData
    for (const key in userData) {
      if (userData.hasOwnProperty(key)) {
        formData.append(key, userData[key]);
      }
    }

    // Añade el archivo de imagen a FormData
    if (imageFile) {
      formData.append('archivo', imageFile);
    }
    const response = await api.post(
      URLs.BASE + URLs.REQUEST_CHAT_MESSAGE_CREATE,
      formData,
      {
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    // console.log("response.-" + response)
    if (response.status === 201) {
      return { data: response.data, status: true }; // El registro fue exitoso
    }
    return { data: null, status: false }; // El registro fue exitoso
  } catch (error) {
    throw error; // Manejo de errores
  }
};

export const setGifByForm = async (token: string, userData: any) => {
  // Verifica si el token es nulo o vacío
  if (!token) {
    // Obtén el token almacenado en AsyncStorage
    const storedToken = await AsyncStorage.getItem('token');
    if (storedToken) {
      token = storedToken;
    } else {
      throw new Error('No token available');
    }
  }

  try {
    const formData = new FormData();

    // Añade los datos de usuario a FormData
    for (const key in userData) {
      if (userData.hasOwnProperty(key)) {
        formData.append(key, userData[key]);
      }
    }

    const response = await api.post(
      URLs.BASE + URLs.REQUEST_CHAT_MESSAGE_CREATEGIF,
      formData,
      {
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    // console.log("response.-" + response)
    if (response.status === 201) {
      return { data: response.data, status: true }; // El registro fue exitoso
    }
    return { data: null, status: false }; // El registro fue exitoso
  } catch (error) {
    throw error; // Manejo de errores
  }
};

export const getStatesList = async () => {
  try {
    const response = await api.get(URLs.BASE + URLs.STATES_LIST);
    return response.data; // Devuelve los datos de los estados
  } catch (error) {
    throw error; // Manejo de errores
  }
};

export async function getDataRequestAgent(token: string, id: number) {
  try {
    const response = await api.get(
      URLs.BASE + URLs.AGENT_REQUEST_RETRIEVE + id,
      {
        headers: { Authorization: `token ${token}` },
      }
    );
    const newData = response.data;
    return { results: newData };
  } catch (error) {
    throw error; // Manejo de errores
  }
}

export async function getDataRequestCustomer(token: string, id: number) {
  try {
    const response = await api.get(
      URLs.BASE + URLs.CUSTOMER_REQUEST_RETRIEVE + id,
      {
        headers: { Authorization: `token ${token}` },
      }
    );
    const newData = response.data;
    return { results: newData };
  } catch (error) {
    throw error; // Manejo de errores
  }
}

export const loginUser = async (data: any): Promise<{ token: string }> => {
  try {
    const response = await api.post(URLs.BASE + URLs.LOGIN, data);
    return { token: response.data.token };
  } catch (error) {
    throw error;
  }
};
export const logoutUser = async (
  data: any,
  token: string
): Promise<{ token: string }> => {
  console.log('logoutUser');
  console.log(data);
  console.log({
    headers: { Authorization: `token ${token}` },
  });
  try {
    const response = await api.post(URLs.BASE + URLs.LOGOUT, data, {
      headers: { Authorization: `token ${token}` },
    });
    // API doesn't return a token on logout; return an empty token to satisfy the TS signature
    return { token: '' };
  } catch (error) {
    console.log('error');
    console.log(error);
    throw error;
  }
};

export const getUserInfo = async (token: string): Promise<AgentList> => {
  try {
    const response = await api.get(URLs.BASE + URLs.INFO_USER, {
      headers: { Authorization: `token ${token}` },
    });
    // Analiza y devuelve los datos de respuesta según sea necesario
    return response.data[0] as AgentList;
  } catch (error) {
    throw error;
  }
};

export async function getListRequestCustomer(
  token: string,
  usuario: number | undefined,
  agente: number | undefined,
  typeRequest: number | null,
  estatus: number | undefined,
  nextPage?: string
) {
  console.log('getListRequestCustomer');
  const url = nextPage ? nextPage : URLs.BASE + URLs.CUSTOMER_REQUEST_LIST;
  try {
    const parametros: { [key: string]: any } = {};
    if (usuario !== undefined) {
      parametros.usuario = usuario;
    }
    if (agente !== undefined) {
      parametros.agente = agente;
    }
    if (typeRequest !== null) {
      parametros.tipo = typeRequest;
    }
    if (estatus !== undefined) {
      parametros.estatus = estatus;
    }
    console.log(parametros);

    console.log('usuario url.- ' + url);
    const response = await api.get(url, {
      params: parametros,
      headers: { Authorization: `token ${token}` },
    });
    // console.log(response)
    const data = response.data;

    if (data && data.results) {
      const resultadosPaginacion = data.results;
      const promises = resultadosPaginacion.map((resultado: { id: string }) =>
        getCustomerResultDetail(token, resultado.id)
      );
      const resultadosDetalles = await Promise.all(promises);
      const resultadosCombinados = resultadosPaginacion.map(
        (resultado: any, index: number) => ({
          ...resultado,
          ...resultadosDetalles[index],
        })
      );
      return resultadosCombinados;
    } else {
      throw new Error('No se pudieron obtener los detalles de los resultados');
    }
  } catch (error) {
    console.error('There was a problem with your Axios request:', url, error);
    return null;
  }
}

export async function getListRequestAgent(
  token: string,
  agente: number | undefined,
  usuario: number | undefined,
  typeRequest: number | null,
  estatus: number | undefined,
  nextPage?: string
) {
  console.log('getListRequestAgent');

  const url = nextPage ? nextPage : URLs.BASE + URLs.AGENT_REQUEST_LIST;
  try {
    const parametros: { [key: string]: any } = {};
    if (agente !== undefined) {
      parametros.agente = agente;
    }
    if (usuario !== undefined) {
      parametros.usuario = usuario;
    }
    if (typeRequest !== null) {
      parametros.tipo = typeRequest;
    }
    if (estatus !== undefined) {
      parametros.estatus = estatus;
    }
    console.log(parametros);

    console.log('agente url.- ' + url);
    const response = await api.get(url, {
      params: parametros,
      headers: { Authorization: `token ${token}` },
    });

    const data = response.data;
    if (data && data.results) {
      const resultadosPaginacion = data.results;
      const promises = resultadosPaginacion.map((resultado: { id: string }) =>
        getAgentResultDetail(token, resultado.id)
      );
      const resultadosDetalles = await Promise.all(promises);
      const resultadosCombinados = resultadosPaginacion.map(
        (resultado: any, index: number) => ({
          ...resultado,
          ...resultadosDetalles[index],
        })
      );
      return resultadosCombinados;
    } else {
      throw new Error('No se pudieron obtener los detalles de los resultados');
    }
  } catch (error) {
    console.error('There was a problem with your Axios request:', url, error);
    return null;
  }
}

export async function getRetrieveRequestCustomer(
  token: string,
  idRequest: number
) {
  try {
    const response = await api.get(
      URLs.BASE + URLs.AGENT_REQUEST_RETRIEVE + idRequest,
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );
    const resultados = response.data;
    if (resultados) {
      /* const resultadosDetalles = getCustomerResultDetail(resultados.id);
            const resultadosCombinados = {
                ...resultados,
                ...resultadosDetalles
            }; */
      return { data: resultados };
    } else {
      throw new Error('No se pudieron obtener los detalles de los resultados');
    }
  } catch (error) {
    console.error(
      'There was a problem with your Axios request:',
      URLs.BASE + URLs.AGENT_REQUEST_RETRIEVE + idRequest,
      error
    );
    return null;
  }
}

export async function getRetrieveRequestAgent(
  token: string,
  idRequest: number
) {
  try {
    const response = await api.get(
      URLs.BASE + URLs.AGENT_REQUEST_RETRIEVE + idRequest,
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );
    const resultados = response.data;
    if (resultados) {
      /* const resultadosDetalles = getAgentResultDetail(resultados.id);
            const resultadosCombinados = {
                ...resultados,
                ...resultadosDetalles
            }; */
      return { data: resultados };
    } else {
      throw new Error('No se pudieron obtener los detalles de los resultados');
    }
  } catch (error) {
    console.error(
      'There was a problem with your Axios request:',
      URLs.BASE + URLs.AGENT_REQUEST_RETRIEVE + idRequest,
      error
    );
    return null;
  }
}

export async function getCustomerCountNewRequests(token: string) {
  try {
    const response = await api.get(URLs.BASE + URLs.CUSTOMER_REQUEST_COUNT, {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    const data = response.data;
    return data;
  } catch (error) {
    console.log('No se pudo obtener el total de nuevas solicitudes.');
    console.error(
      'There was a problem with your Axios request:',
      URLs.BASE + URLs.CUSTOMER_REQUEST_COUNT,
      error
    );
    return null;
  }
}

export async function getAgentCountNewRequests(token: string, id: number) {
  const parametros: { [key: string]: any } = {
    usuario: id,
  };
  // console.log("user id.- " + id)
  try {
    const response = await api.get(URLs.BASE + URLs.AGENT_REQUEST_COUNT, {
      params: parametros,
      headers: {
        Authorization: `token ${token}`,
      },
    });
    const data = response.data;
    return data;
  } catch (error) {
    console.error(
      'No se pudo obtener el detalle del resultado',
      'Vuelve a intentarlo más tarde'
    );
    console.error(
      'There was a problem with your Axios request:',
      URLs.BASE + URLs.AGENT_REQUEST_COUNT,
      error
    );
    return null;
  }
}

export async function getTotalCountNewRequests(token: string) {
  try {
    const response = await api.get(URLs.BASE + URLs.TOTAL_REQUEST_COUNT, {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error) {
      console.error('Error de respuesta del servidor:', error);
    }
    console.log('No se pudo obtener el total de nuevas solicitudes.');
    return null;
  }
}

export async function getListAgentSelfRequests(token: string) {
  try {
    const response = await api.get(URLs.BASE + URLs.LIST_AGENTS_SELF_REQUEST, {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    const data = response.data;
    return data;
  } catch (error) {
    console.error(
      'No se pudo obtener los agentes',
      'Vuelve a intentarlo más tarde'
    );
    console.error(
      'There was a problem with your Axios request:',
      URLs.BASE + URLs.LIST_AGENTS_SELF_REQUEST,
      error
    );
    return null;
  }
}

export async function getListCustomerSelfRequests(token: string) {
  try {
    const response = await api.get(
      URLs.BASE + URLs.LIST_CUSTOMER_SELF_REQUEST,
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );
    const data = response.data;
    return data;
  } catch (error) {
    console.error(
      'No se pudo obtener los clientes',
      'Vuelve a intentarlo más tarde'
    );
    console.error(
      'There was a problem with your Axios request:',
      URLs.BASE + URLs.LIST_CUSTOMER_SELF_REQUEST,
      error
    );
    return null;
  }
}

export async function getAgentResultDetail(token: string, id: string) {
  try {
    console.log('getAgentResultDetail');
    console.log(URLs.BASE + URLs.AGENT_REQUEST_RETRIEVE + id);
    const response = await api.get(
      URLs.BASE + URLs.AGENT_REQUEST_RETRIEVE + id,
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );
    const data = response.data;
    return data;
  } catch (error) {
    console.error(
      'No se pudo obtener el detalle del resultado',
      'Vuelve a intentarlo más tarde'
    );
    console.error(
      'There was a problem with your Axios request:',
      URLs.BASE + URLs.AGENT_REQUEST_RETRIEVE + id,
      error
    );
    return null;
  }
}

async function getCustomerResultDetail(token: string, id: string) {
  try {
    const response = await api.get(
      URLs.BASE + URLs.CUSTOMER_REQUEST_RETRIEVE + id,
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );
    const data = response.data;
    return data;
  } catch (error) {
    console.error(
      'No se pudo obtener el detalle del resultado',
      'Vuelve a intentarlo más tarde'
    );
    console.error(
      'There was a problem with your Axios request:',
      URLs.BASE + URLs.CUSTOMER_REQUEST_RETRIEVE + id,
      error
    );
    return null;
  }
}

export async function setTokenFirebaseUser(token: string, userData: any) {
  try {
    const formData = new FormData();

    // Add user data to FormData
    for (const key in userData) {
      if (userData.hasOwnProperty(key)) {
        formData.append(key, userData[key]);
      }
    }

    // Log FormData contents
    //for (let pair of formData.getParts()) {
    //  console.log(`${pair}: ${pair}`);
    //}
    console.log('url');
    console.log(URLs.BASE + URLs.DEVICES_TOKEN);
    console.log('formData');
    console.log(formData);
    const response = await api.post(URLs.BASE + URLs.DEVICES_TOKEN, formData, {
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    const data = response.data;
    console.log(data);
    return data;
  } catch (error) {
    console.error(
      'No se pudo guardar el token del dispositivo',
      'Vuelve a intentarlo más tarde'
    );
    console.error(
      'There was a problem with your Axios request:',
      URLs.BASE + URLs.DEVICES_TOKEN,
      error
    );
    return null;
  }
}

export async function getSolicitudChatData(
  idSolicitud: number,
  token: string
): Promise<dataChats[] | null> {
  try {
    // Llamar al primer servicio para obtener la lista de solicitudes de chat
    const solicitudChatList = await getListSolicitudChat(idSolicitud, token);

    // Verificar si la lista de solicitudes de chat no está vacía
    if (solicitudChatList && solicitudChatList.length > 0) {
      // Obtener el primer ID de solicitud de chat de la lista
      const promises = solicitudChatList.map((chatList: { id: number }) =>
        getRetrieveSolicitudChat(token, chatList.id)
      );
      const resultadosDetalles = await Promise.all(promises);
      const resultadosCombinados = solicitudChatList.map(
        (chatList: any, index: number) => ({
          ...chatList,
          ...resultadosDetalles[index],
        })
      );
      return resultadosCombinados;
    } else {
      // Si la lista de solicitudes de chat está vacía, devolver null
      return null;
    }
  } catch (error) {
    // Manejar errores
    console.error(
      'No se pudo obtener el detalle de la solicitud de chat',
      'Vuelve a intentarlo más tarde'
    );
    console.error(
      'There was a problem with your Axios request:',
      'getSolicitudChatData',
      error
    );
    return null;
  }
}

export async function getListSolicitudChat(idSolicitud: number, token: string) {
  try {
    const response = await api.get(URLs.BASE + URLs.REQUEST_CHAT_LIST, {
      params: {
        solicitud: idSolicitud,
      },
      headers: {
        Authorization: `token ${token}`,
      },
    });
    const data = response.data;
    return data;
  } catch (error) {
    console.error(
      'No se pudo obtener el detalle del resultado',
      'Vuelve a intentarlo más tarde'
    );
    console.error(
      'There was a problem with your Axios request:',
      URLs.BASE + URLs.REQUEST_CHAT_LIST,
      error
    );
    return null;
  }
}

export async function getRetrieveSolicitudChat(
  token: string,
  idSolicitudChat: number
) {
  const url = `${URLs.BASE}${URLs.REQUEST_CHAT_RETRIEVE}${idSolicitudChat}`;
  try {
    // Verifica si el token es nulo o vacío
    if (!token) {
      // Obtén el token almacenado en AsyncStorage
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        token = storedToken;
      } else {
        throw new Error('No token available');
      }
    }

    console.log('URL:', url);

    const response = await api.get(url, {
      headers: {
        Authorization: `token ${token}`,
      },
    });

    const data = response.data;
    return data;
  } catch (error) {
    console.error(
      'No se pudo obtener el detalle del resultado.- ' + idSolicitudChat,
      'Vuelve a intentarlo más tarde'
    );
    console.error('There was a problem with your Axios request:', url, error);
    return null;
  }
}

async function getListUsers(token: string, userRol: number) {
  try {
    const response = await api.get(URLs.BASE + URLs.USER_ADMIN_LIST, {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    // console.log(response.data)
    const data = response.data;
    if (data) {
      const promises = data.map((agent: { id: number }) =>
        getAgentDetail(token, agent.id)
      );
      const resultadosDetalles = await Promise.all(promises);
      const resultadosCombinados = data.map((agent: any, index: number) => ({
        ...agent,
        ...resultadosDetalles[index],
      }));

      const filteredAgents = resultadosCombinados
        .filter((agent: { rol: number }) => agent.rol === userRol)
        .map(
          (agent: {
            id: number;
            first_name: string;
            last_name: string;
            materno: string;
          }) => ({
            ...agent,
            value: agent.id,
            label: `${agent.first_name} ${agent.last_name} ${agent.materno}`,
          })
        );
      console.log('filteredAgents');
      console.log(filteredAgents);
      return filteredAgents;
    } else {
      throw new Error('No se pudieron obtener los detalles de los resultados');
    }
  } catch (error) {
    console.error(
      'No se pudo obtener la lista de usuarios',
      'Vuelve a intentarlo más tarde'
    );
    console.error(
      'There was a problem with your Axios request:',
      URLs.BASE + URLs.USER_ADMIN_LIST,
      error
    );
    return null;
  }
}

async function getAgentDetail(token: string, id: number) {
  try {
    const response = await api.get(URLs.BASE + URLs.USER_ADMIN_RETRIEVE + id, {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    const data = response.data;
    return data;
  } catch (error) {
    console.error(
      'No se pudo obtener el detalle del resultado',
      'Vuelve a intentarlo más tarde'
    );
    console.error(
      'There was a problem with your Axios request:',
      URLs.BASE + URLs.USER_ADMIN_RETRIEVE + id,
      error
    );
    return null;
  }
}

export async function getPaginadoAgentDirectory(token: string): Promise<{
  results: AgentList[];
  count: number;
  next: string;
  previous: string;
}> {
  try {
    const response = await api.get(URLs.BASE + URLs.USER_ADMIN_PAGINATED, {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    const data = response.data;
    if (data) {
      const promises = data.results.map((agent: { id: number }) =>
        getAgentDetail(token, agent.id)
      );
      const resultadosDetalles = await Promise.all(promises);
      const resultadosCombinados = data.results.map(
        (agent: any, index: number) => ({
          ...agent,
          ...resultadosDetalles[index],
        })
      );
      return {
        results: resultadosCombinados,
        count: data.count,
        next: data.next,
        previous: data.previous,
      };
    } else {
      throw new Error('No se pudieron obtener los detalles de los resultados');
    }
  } catch (error) {
    console.error(
      'No se pudo obtener la lista de usuarios',
      'Vuelve a intentarlo más tarde'
    );
    console.error(
      'There was a problem with your Axios request:',
      URLs.BASE + URLs.USER_ADMIN_PAGINATED,
      error
    );
    return { results: [], count: 0, next: '', previous: '' };
  }
}
export async function getListAgentDirectory(
  token: string
): Promise<{ results: AgentList[] }> {
  try {
    const response = await api.get(URLs.BASE + URLs.DIRECTORY_LIST, {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    const data = response.data;
    return { results: data };
    if (data) {
      const promises = data.map((agent: { id: number }) =>
        getAgentDetail(token, agent.id)
      );
      const resultadosDetalles = await Promise.all(promises);
      const resultadosCombinados = data.map((agent: any, index: number) => ({
        ...agent,
        ...resultadosDetalles[index],
      }));
      return { results: resultadosCombinados };
    } else {
      throw new Error('No se pudieron obtener los detalles de los resultados');
    }
  } catch (error) {
    console.error(
      'No se pudo obtener la lista de usuarios',
      'Vuelve a intentarlo más tarde'
    );
    console.error(
      'There was a problem with your Axios request:',
      URLs.BASE + URLs.USER_ADMIN_LIST,
      error
    );
    return { results: [] };
  }
}

interface ApiResponse {
  results: any;
  count: number;
  next: string;
  previous: string;
}

export async function loadNextPage(
  token: string,
  nextPage: string
): Promise<ApiResponse> {
  try {
    const response = await api.get(nextPage, {
      headers: { Authorization: `token ${token}` },
    });
    const resultadosPaginacion = response.data;
    const promises = resultadosPaginacion.map((resultado: { id: string }) =>
      getAgentResultDetail(token, resultado.id)
    );
    const resultadosDetalles = await Promise.all(promises);
    const resultadosCombinados = resultadosPaginacion.map(
      (resultado: any, index: number) => ({
        ...resultado,
        ...resultadosDetalles[index],
      })
    );
    return {
      results: resultadosCombinados,
      count: resultadosPaginacion.data.count,
      next: resultadosPaginacion.next,
      previous: resultadosPaginacion.previous,
    };
  } catch (error) {
    console.error('Error loading next page:', error);
    return { results: [], count: 0, next: '', previous: '' };
  }
}

export async function getListChats(
  token: string,
  solicitudChatID: number,
  lastId: number | null
) {
  const parametros: { [key: string]: any } = {
    solicitud_chat: solicitudChatID,
  };
  if (lastId !== null) {
    parametros.last_id = lastId;
  }

  try {
    const response = await api.get(URLs.BASE + URLs.REQUEST_CHAT_MESSAGE_LIST, {
      params: parametros,
      headers: {
        Authorization: `token ${token}`,
      },
    });
    const data = response.data;

    if (data) {
      const promises = data.map((chat: { usuario: number }) =>
        getChatDetail(token, chat.usuario)
      );
      const chatDetails = await Promise.all(promises);

      const chatsWithDetails = data.map((chat: any, index: number) => {
        return { ...chat, ...chatDetails[index] };
      });

      const lastChatId =
        chatsWithDetails.length > 0
          ? chatsWithDetails[chatsWithDetails.length - 1].id
          : null;
      return { data: chatsWithDetails, lastID: lastChatId };
    }
  } catch (error) {
    console.error(
      'No se pudo obtener la lista de chats',
      'Vuelve a intentarlo más tarde'
    );
    console.error(
      'There was a problem with your Axios request:',
      URLs.BASE + URLs.REQUEST_CHAT_MESSAGE_LIST,
      error
    );
    throw error;
  }
}

export function getChatDetail(token: string, id: number) {
  return api
    .get(URLs.BASE + URLs.USER_ADMIN_RETRIEVE + id, {
      headers: {
        Authorization: `token ${token}`,
      },
    })
    .then(response => {
      const data = response.data;
      return data; // Devuelve los datos del detalle
    })
    .catch(error => {
      // Manejar errores
      console.error(
        'No se pudo obtener el detalle del chat',
        'Vuelve a intentarlo más tarde'
      );
      console.error(
        'There was a problem with your Axios request:',
        URLs.BASE + URLs.USER_ADMIN_RETRIEVE + id,
        error
      );
      return null; // Devuelve null en caso de error
    });
}

function setError(error: unknown) {
  console.error('Error:', error);
}

export { getListUsers, getAgentDetail, setError };
