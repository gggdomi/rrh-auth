Plugin for [RRH](https://github.com/gggdomi/rrh) to help with authentication workflow. Store credentials, authenticate requests and redirect to login if needed.

## Installation

### Pre-requisites

- [RRH](https://github.com/gggdomi/rrh) need to be set up
- [connected-react-router](https://github.com/supasate/connected-react-router) is required to be able to change location by dispacthing action. It's a drop-in replacement for `react-router` and might be of use if you mix react-router with redux in your project.

### Add to RRH plugins

```js
// index.js
import rrh from '@gggdomi/rrh'
import rrhAuth from '@gggdomi/rrh-auth'

rrh.plugins = [rrhAuth]
```

### Add auth reducer

```js
// reducers.js
import { rrhReducers } from '@gggdomi/rrh' // from RRH readme
import { authReducer } from '@gggdomi/rrh-auth'

export const rootReducer = combineReducers({
    your: yourReducer,
    rrh: combineReducers(rrhReducers), // from RRH readme
    auth: authReducer,
  })
```

### Add rrh-auth sagas to the app

```js
// index.js
import rrhAuthSagas from '@gggdomi/rrh-auth/src/sagas'

// configure saga middleware...

rrhAuthSagas.map(sagaMiddleware.run)
```

### Tell which _server-side_ endpoints are used to login

`isLoginEndpoint` will tell `rrh-auth` to look for credentials when calling these endpoints

```js
import rrh from '@gggdomi/rrh'

export const postLogin = rrh.new('SUBMIT_LOGIN', '/login/', {
  method: 'POST',
  isLoginEndpoint: true, // here
})
```

## Usage

### Dispatch actions to log in/out

```js
import { logOutAction } from '@gggdomi/rrh-auth'
import { postLogin } from './actions'

const ExComponent = ({ triggerLogOut }) => (
  <button onClick={triggerLogIn}>Log in</button>
  <button onClick={triggerLogOut}>Log out</button>
)

const mapDispatchToProps = dispatch => ({
  triggerLogIn: () => dispatch(postLogin.Start({  
    // using postLogin route created above
    data: {user: "John", pass: "123456" }
  })),
  triggerLogOut: () => dispatch(logOutAction()),
})

export default connect(null, mapDispatchToProps)(ExComponent)
```

## Configuration

Right now `rrh-auth` only supports authentication via JWT tokens and Authorization header. Other authentication means could easily be added, feel free to open an issue if needed.

```js
// rrhAuth.config:
{
  jwt: {
    // to use rrh-auth with jwt (default: true)
    use: true,
    
    // how to extract JWT token from the server response
    getToken: data => data.access_token,  // <- default value
    
    // how to create the Authorization header given the token
    makeAuthHeader: accessToken => 'Bearer ' + accessToken, // <- default value
    
    // how to extract user infos from decoded token
    getInfos: data => data.identity, // <- default value
  },

  // set to true to automatically logout when getting a 401 status (ie. invalid/missing credentials) (default: true)
  shouldLogoutOn401: true,
  
  // if not null, we push this URL (default: '/')
  redirectToOnLoggedIn: '/home/',
  
  // if not null, set to true to automatically display login page when logging out (default: '/login/')
  loginRoute: '/login/',
  
  // if not null, this endpoint will be called on the server when logging out (default: '/logout/')
  logoutEndpoint: '/logout/',
}
```

### Example:

Let's say your API:
- on successful login (POST on '/login/'), the server returns a response containing a token `{ apiToken: "xxxxxxxxxxxx" }`
- is authenticated via Authorization header, with format "Token xxxxxxxxxxxxx".
- once decoded, the user infos are available on the `infos` property of the token
- you need to GET /destroy/ to logout serverside

To configure rrh-auth accordingly:

```js
import rrhAuth from '@gggdomi/rrh-auth'

rrhAuth.config.jwt.getToken = data => data.apiToken
rrhAuth.config.jwt.makeAuthHeader = token => `Token ${token}`
rrhAuth.config.jwt.getInfos = x => x.infos
rrhAuth.config.logoutEndpoint = '/destroy/'
```

### Routes options

```js
import rrh from '@gggdomi/rrh'

export const fetchPosts = rrh.new('FETCH_POSTS', '/posts/', {
  // will tell rrh-auth to look for credentials when calling these endpoints (default: false)
  isLoginEndpoint: false,
  
  // if set to true, we won't redirect to login for this route if we get a 401 from server (default: false)
  ignore401: true, 

  // if set to false, we won't attach token to request (default: true)
  authenticated: false,
})
```

## Advanced customization

Redirection to login page on logout or invalid credentials, and calling a server endpoint on logout are built in `rrh-auth` by default. If you need more specific behavior, you can set `loginRoute` and `logoutEndpoint` to `null` and then take `logOutAction` and `loggedInAction` in your own sagas

Example:

```js
import { logOutAction, loggedInAction } from '@gggdomi/rrh-auth'
import { push } from 'connected-react-router'

export function* loggedInSaga() {
  yield takeEvery(loggedInAction().type, function*(action) {
    // We do some stuff and redirect to root on successful login
    doSomeStuff()
    yield put(push('/'))
  })
}

export function* logOutSaga() {
  yield takeEvery(logOutAction().type, function*(action) {
    // we do some stuff on logout
    doSomeStuff()
  })
}

// don't forget to then run the sagas
```
