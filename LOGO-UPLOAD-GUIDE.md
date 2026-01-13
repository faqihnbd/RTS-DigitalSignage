# 📋 CARA UPLOAD DAN PILIH LOGO - PANDUAN LENGKAP

## 🎯 **WORKFLOW LENGKAP**

### **Step 1: Upload Logo ke Database** 📤

1. **Buka Frontend Admin:**

   ```
   http://localhost:5173
   ```

2. **Navigate ke Upload Section:**

   - Klik **"Konten"** di sidebar kiri
   - Pilih **"Upload Media"**

3. **Upload Logo Files:**

   - Klik **"Choose Files"** atau drag & drop
   - Select logo files (PNG, JPG, JPEG, GIF)
   - Klik **"Upload"**
   - Wait untuk upload selesai

4. **Verify Upload:**
   - Logo akan muncul di list konten
   - Note the **Content ID** (auto-generated)

### **Step 2: Pilih Logo di Layout Builder** 🎨

1. **Navigate ke Layout:**

   - Klik **"Layout"** di sidebar
   - Pilih layout yang ingin diedit
   - Atau create new layout

2. **Add/Edit Logo Zone:**

   - Drag **"Logo"** dari content types ke canvas
   - Atau klik existing logo zone

3. **Configure Logo Settings:**

   - Di panel kanan, scroll ke **"Pengaturan Khusus"**
   - **Select Logo Content:** Dropdown akan menampilkan uploaded images
   - Pilih logo yang diinginkan
   - Configure scale, size, opacity, dll.

4. **Save Layout:**
   - Klik **"Simpan Pengaturan"**

## 🗃️ **AVAILABLE CONTENT IN DATABASE**

**Current Images Available for Logo:**

```
✅ ID: 7  - gojek.png (image)
✅ ID: 8  - promo kuliner.jpg (image)
✅ ID: 10 - gojekgocar.jpg (image)
```

**Total Content Breakdown:**

- 📹 **Video:** 3 files
- 🖼️ **Image:** 3 files (available for logo)
- 📝 **Text:** 1 file

## 🛠️ **TECHNICAL DETAILS**

### **Database Schema:**

```sql
-- Content table structure
{
  id: INTEGER (auto-increment),
  tenant_id: INTEGER,
  user_id: INTEGER,
  type: ENUM('image', 'video', 'text'),  -- Key field for filtering
  filename: STRING,
  url: STRING,
  size: INTEGER,
  duration_sec: INTEGER,
  uploaded_at: TIMESTAMP
}
```

### **Frontend Filter Logic:**

```javascript
// Logo dropdown filters for image type
contents
  .filter((content) => content.type === "image")
  .map((content) => (
    <option key={content.id} value={content.id}>
      {content.filename} ({content.type})
    </option>
  ));
```

## 🧪 **TESTING STEPS**

### **Test Upload Process:**

1. Go to: `http://localhost:5173/contents`
2. Upload a new logo file
3. Verify it appears in content list

### **Test Logo Selection:**

1. Go to: `http://localhost:5173/layouts`
2. Edit any layout
3. Add/click logo zone
4. Check dropdown shows uploaded images

### **Test Display Result:**

1. Configure logo in layout
2. Assign layout to device
3. Check: `http://localhost:5174/?device=TV002`

## 🔧 **TROUBLESHOOTING**

### **Problem: Dropdown Empty**

**Cause:** No images uploaded atau content belum di-fetch
**Solution:**

1. Upload images via Konten → Upload Media
2. Refresh layout builder page
3. Check browser console for API errors

### **Problem: Logo Not Displaying**

**Cause:** Content ID tidak valid atau file missing
**Solution:**

1. Verify content_id in zone settings
2. Check file exists di `/uploads/` folder
3. Check console for 404 errors

### **Problem: Upload Failed**

**Cause:** File size, format, atau permission issues
**Solution:**

1. Check file format (PNG, JPG supported)
2. Check file size limit
3. Check backend upload folder permissions

## 📝 **EXAMPLE USAGE**

### **Complete Logo Setup:**

```javascript
// 1. Upload gojek.png via frontend
// 2. Set zone settings:
{
  "content_id": 7,           // Selected from dropdown
  "scale": "contain",        // Fit mode
  "max_width": "80%",       // Size limit
  "max_height": "80%",
  "opacity": 0.9,           // 90% transparency
  "background": "transparent"
}
```

### **Result in Frontend Display:**

- Logo displays with correct scaling
- 90% opacity applied
- Transparent background
- Responsive sizing

## 🎉 **SUMMARY**

✅ **Upload Process:** Konten → Upload Media → Choose Files
✅ **Selection Process:** Layout → Logo Zone → Select Logo Content dropdown  
✅ **Available Content:** 3 images ready untuk selection
✅ **Frontend Fixed:** Using correct `type` field instead of `file_type`

**Now logo selection dropdown will show all uploaded images!** 🚀
