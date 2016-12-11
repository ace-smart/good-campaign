import {
  REQUEST_POST_PERMISSION_OFFER, COMPLETE_POST_PERMISSION_OFFER,
  REQUEST_GET_RECEIVED_PERMISSION_OFFERS, COMPLETE_GET_RECEIVED_PERMISSION_OFFERS
} from '../constants/actionTypes';
import { API_GRANT_PERMISSIONS_ENDPOINT, API_RECEIVED_PERMISSIONS_ENDPOINT } from '../constants/endpoints';

export function requestPostPermissionOffer() {
  return { type: REQUEST_POST_PERMISSION_OFFER };
}
export function completePostPermissionOffer(payload) {
  return { type: COMPLETE_POST_PERMISSION_OFFER, payload };
}

export function requestGetReceivedPermissionOffers() {
  return { type: REQUEST_GET_RECEIVED_PERMISSION_OFFERS };
}
export function completeGetReceivedPermissionOffers(payload) {
  return { type: COMPLETE_GET_RECEIVED_PERMISSION_OFFERS, payload };
}

export function getReceivedPermissionOffers() {
  return dispatch => {
    dispatch(requestGetReceivedPermissionOffers());
    const xhr = new XMLHttpRequest();
    xhr.open('GET', API_RECEIVED_PERMISSIONS_ENDPOINT);
    xhr.onload = () => {
      if (xhr.responseText) {
        // Convert response from JSON
        const receivedPermissionArray = JSON.parse(xhr.responseText).map(x => {
          x.createdAt = new Date(x.createdAt);
          x.updatedAt = new Date(x.updatedAt);
          return x;
        });

        dispatch(completeGetReceivedPermissionOffers(receivedPermissionArray));
      } else {
        dispatch(completeGetReceivedPermissionOffers([]));
      }
    };
    xhr.send();
  };
}

export function postPermissionOffer(campaign) {
  return dispatch => {
    dispatch(requestPostPermissionOffer());

    const xhr = new XMLHttpRequest();
    xhr.open('POST', API_GRANT_PERMISSIONS_ENDPOINT);
    xhr.onload = () => {
      const permissionResponse = JSON.parse(xhr.responseText);
      const status = xhr.status;
      dispatch(completePostPermissionOffer({ ...permissionResponse, status  }));
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(campaign);
  };
}
