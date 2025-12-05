from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
import app.services.firebase # Ensures Firebase app is initialized

# This defines the security scheme (Bearer Token)
security = HTTPBearer()

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verifies the Firebase ID Token sent in the Authorization header.
    Returns the decoded token (user info) if valid, otherwise raises 401.
    """
    token = credentials.credentials
    
    try:
        # 1. Verify the token with Firebase Admin
        # This checks the signature, expiration, and project ID
        decoded_token = auth.verify_id_token(token)
        
        # 2. (Optional) You can return the full user object or just the uid
        # return decoded_token 
        return decoded_token['uid']
        
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        print(f"Auth Error: {e}") # Log it for debugging
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
