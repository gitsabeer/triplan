
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() > exp;
  } catch {
    return true;
  }
}

export function haveValidToken(){
  const token = localStorage.getItem('access_token');
  if (isTokenExpired(token)) {
    removeToken()
    return false
  }
  return true;
}

export function storeToken(token: string){  
   localStorage.setItem('access_token', token);
}

export function removeToken(){  
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
}


export function getToken(){
  const token = localStorage.getItem('access_token');
  return token;
}