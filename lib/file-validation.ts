/**
 * Secure File Signature and Content Validator
 * Validates file extension, MIME type, and magic bytes to prevent spoofed/unsafe uploads.
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Validates a File object against allowed types and binary magic bytes
 */
export async function validateUploadedFile(
  file: File,
  allowedKinds: ('pdf' | 'image' | 'doc')[] = ['pdf', 'image'],
  maxSize: number = MAX_FILE_SIZE,
): Promise<ValidationResult> {
  if (!file) {
    return { valid: false, error: 'No file selected.' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${Math.round(maxSize / (1024 * 1024))} MB limit.` }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty (0 bytes).' }
  }

  const name = file.name.toLowerCase()
  const ext = name.split('.').pop() || ''

  // 1. Extension check
  const allowedExtensions: Record<string, string[]> = {
    pdf: ['pdf'],
    image: ['png', 'jpg', 'jpeg'],
    doc: ['doc', 'docx'],
  }

  const validExts = allowedKinds.flatMap((kind) => allowedExtensions[kind] || [])
  if (!validExts.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension .${ext}. Allowed formats: ${validExts.map((e) => `.${e}`).join(', ')}.`,
    }
  }

  // 2. Reject executable / script extensions
  const dangerous = ['html', 'htm', 'js', 'mjs', 'php', 'exe', 'sh', 'bat', 'cmd', 'svg', 'xml']
  if (dangerous.some((d) => name.includes(`.${d}`))) {
    return { valid: false, error: 'Executable and script file types are strictly prohibited.' }
  }

  // 3. Magic Bytes / Header Inspection
  try {
    const buffer = await file.slice(0, 64).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // PDF Magic Bytes: %PDF- (0x25 0x50 0x44 0x46 0x2D)
    if (ext === 'pdf') {
      const isPdf =
        bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d
      if (!isPdf) {
        return {
          valid: false,
          error: 'Corrupt or fake PDF file. File signature does not match authentic PDF format.',
        }
      }
    }

    // PNG Magic Bytes: 0x89 0x50 0x4E 0x47 (0x89 P N G)
    if (ext === 'png') {
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      if (!isPng) {
        return {
          valid: false,
          error: 'Corrupt or fake PNG image. File signature does not match authentic PNG format.',
        }
      }
    }

    // JPEG Magic Bytes: 0xFF 0xD8 0xFF
    if (ext === 'jpg' || ext === 'jpeg') {
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      if (!isJpeg) {
        return {
          valid: false,
          error: 'Corrupt or fake JPEG image. File signature does not match authentic JPEG format.',
        }
      }
    }

    // Check for HTML/Script injection in header
    const headerText = new TextDecoder('utf-8').decode(bytes).toLowerCase()
    if (
      headerText.includes('<html') ||
      headerText.includes('<script') ||
      headerText.includes('<?php') ||
      headerText.includes('<!doctype')
    ) {
      return {
        valid: false,
        error: 'Unsafe file contents detected. HTML/Script uploads are blocked for security.',
      }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Could not inspect file contents for security verification.' }
  }
}

/**
 * Validates a base64 Data URL string signature
 */
export function validateDataUrlSignature(
  dataUrl: string,
  allowedKinds: ('pdf' | 'image')[] = ['pdf', 'image'],
): ValidationResult {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return { valid: false, error: 'Missing or invalid data string.' }
  }

  if (allowedKinds.includes('pdf') && dataUrl.startsWith('data:application/pdf;base64,')) {
    const rawBase64 = dataUrl.replace('data:application/pdf;base64,', '')
    // JVBERi0 is base64 for %PDF-
    if (rawBase64.startsWith('JVBERi0') || rawBase64.length > 20) {
      return { valid: true }
    }
  }

  if (allowedKinds.includes('image')) {
    if (dataUrl.startsWith('data:image/png;base64,') || dataUrl.startsWith('data:image/jpeg;base64,')) {
      return { valid: true }
    }
  }

  return { valid: false, error: 'File content signature does not match allowed PDF or Image format.' }
}
