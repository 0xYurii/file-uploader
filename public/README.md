# File Uploader - Frontend Documentation

## Overview
A modern, responsive frontend for the File Uploader web application built with vanilla HTML, CSS, and JavaScript. Features a clean UI inspired by Dropbox and Google Drive, with full authentication, file management, and folder organization capabilities.

## Files Created

### 📁 `/public/` Directory Structure
```
public/
├── index.html       # Authentication page (login/signup)
├── dashboard.html   # Main dashboard with file management
├── styles.css       # Complete styling (responsive, modern design)
└── app.js          # All JavaScript logic and API calls
```

## Features Implemented

### ✅ Authentication (`index.html`)
- **Toggle Forms**: Smooth transition between login and signup
- **Form Validation**: Client-side validation with helpful error messages
- **Loading States**: Visual feedback during API calls
- **Auto-redirect**: Successful login redirects to dashboard
- **Error Handling**: Clear error messages for failed attempts

### ✅ Dashboard (`dashboard.html`)
- **User Profile**: Display username with avatar
- **File Upload**: 
  - Drag-and-drop support
  - Click to browse files
  - Multiple file selection
  - File preview before upload
  - Progress indication
- **File List**:
  - Grid layout with file cards
  - File metadata (size, upload date)
  - Download, move, and delete actions
  - Empty state when no files
- **Folder Management**:
  - Create new folders
  - View folder contents
  - File count display
  - Folder navigation
- **Storage Info**: Visual storage usage indicator
- **Responsive Design**: Works on desktop, tablet, and mobile

### ✅ JavaScript Logic (`app.js`)
- **API Integration**:
  - All backend endpoints connected
  - Proper authentication with cookies
  - Error handling for all requests
  - 401 redirect for expired sessions
- **File Operations**:
  - Upload with progress
  - Download files
  - Delete files
  - Move files to folders
- **Folder Operations**:
  - Create folders
  - View folder contents
  - Load folder list
- **UI Interactions**:
  - Toast notifications (success, error, warning)
  - Loading spinners
  - Modal dialogs
  - Form validation
  - Responsive navigation

### ✅ Styling (`styles.css`)
- **Modern Design**:
  - CSS variables for consistent theming
  - Smooth transitions and animations
  - Professional color palette
  - Consistent spacing and typography
- **Components**:
  - Buttons (primary, secondary, disabled states)
  - Forms (inputs, labels, error states)
  - Cards (files, folders)
  - Modals (create folder, move file)
  - Toast notifications
  - Loading spinners
- **Responsive**:
  - Mobile-first approach
  - Breakpoints for tablet and desktop
  - Flexible grid layouts
  - Touch-friendly interface

## API Integration

### Authentication Endpoints
```javascript
POST /auth/signup
Body: { username, password, email }

POST /auth/login
Body: { username, password }

POST /auth/logout

GET /auth/me
Returns: { user: { id, username, email } }
```

### File Endpoints
```javascript
POST /api/upload
Form-data: { file: File }

GET /api/files
Returns: { files: [...] }

GET /api/files/:fileId/download

DELETE /api/files/:fileId

PATCH /api/files/:fileId/move
Body: { folderId }
```

### Folder Endpoints
```javascript
POST /api/folders
Body: { name }

GET /api/folders
Returns: { folders: [...] }
```

## Usage Instructions

### 1. Start the Backend Server
```bash
npm run dev
```

### 2. Open in Browser
Navigate to: `http://localhost:3000`

### 3. Create an Account
1. Click "Sign up" on the login page
2. Enter username, email, and password
3. Click "Create Account"
4. You'll be automatically logged in and redirected to the dashboard

### 4. Upload Files
1. Click the upload dropzone or drag files onto it
2. Select one or multiple files
3. Click "Upload Files"
4. Wait for success notification

### 5. Manage Files
- **Download**: Click the download button on any file card
- **Delete**: Click the delete button (confirmation required)
- **Move**: Click the move button and select a folder

### 6. Organize with Folders
1. Click "New Folder" in the Folders view
2. Enter a folder name
3. Move files into folders using the move button
4. Click "Open" on a folder to view its contents

## Technical Details

### Cookie-Based Authentication
All API requests include `credentials: 'include'` to ensure cookies are sent with each request. The backend session is automatically maintained.

### Error Handling
- **401 Errors**: Automatically redirect to login page
- **Network Errors**: Show toast notification with error message
- **Form Errors**: Display inline error messages
- **Validation**: Client-side validation before API calls

### File Upload Implementation
```javascript
const formData = new FormData();
formData.append('file', file);

fetch('/api/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData
});
```

### File Download Implementation
```javascript
window.location.href = `/api/files/${fileId}/download`;
```

## Browser Compatibility
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 968px
- **Desktop**: > 968px

## Security Features
- No sensitive data in localStorage
- Cookie-based authentication (HttpOnly cookies handled by backend)
- CSRF protection via session
- XSS protection (proper escaping)
- Secure file uploads

## Performance Optimizations
- Minimal JavaScript bundle (vanilla JS, no frameworks)
- CSS animations use GPU acceleration
- Lazy loading of file lists
- Debounced search/filter (if implemented)
- Optimized image/icon rendering with SVG

## Customization

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary: #4F46E5;          /* Primary brand color */
    --primary-dark: #4338CA;     /* Hover state */
    --primary-light: #EEF2FF;    /* Light backgrounds */
    --success: #10B981;          /* Success messages */
    --danger: #EF4444;           /* Error messages */
    --warning: #F59E0B;          /* Warning messages */
}
```

### Typography
Change font family:
```css
body {
    font-family: 'Your Font', sans-serif;
}
```

### Layout
Adjust grid columns in `styles.css`:
```css
.files-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}
```

## Troubleshooting

### Files not showing after upload
- Check browser console for errors
- Verify backend is running on port 3000
- Check network tab for failed requests
- Ensure user is authenticated

### Can't login
- Verify credentials are correct
- Check backend console for errors
- Clear browser cookies and try again
- Ensure database is running

### Upload fails
- Check file size limits in backend
- Verify upload directory has write permissions
- Check backend logs for errors
- Try a smaller file first

### Styles not loading
- Hard refresh browser (Ctrl+F5)
- Check browser console for 404 errors
- Verify static file serving is configured
- Check file paths are correct

## Future Enhancements
- [ ] File search/filter
- [ ] Sort files (by name, date, size)
- [ ] Bulk file operations
- [ ] File preview (images, PDFs)
- [ ] Share files with other users
- [ ] File versioning
- [ ] Folder hierarchy (nested folders)
- [ ] Drag-and-drop file organization
- [ ] Context menu (right-click actions)
- [ ] Dark mode toggle

## Credits
Built with ❤️ using vanilla HTML, CSS, and JavaScript.

## License
MIT License - Feel free to use and modify!
