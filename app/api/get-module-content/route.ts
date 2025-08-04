import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 });
    }

    // Check if module content exists in database - doğru tablo adını kullan
    const { data: moduleContents, error } = await supabaseAdmin
      .from('module_contents')
      .select('*')
      .eq('module_id', moduleId);

    console.log('Checking for existing module content:', moduleId);
    console.log('Found contents:', moduleContents?.length || 0);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Database error' 
      }, { status: 500 });
    }

    if (!moduleContents || moduleContents.length === 0) {
      console.log('No existing content found for module:', moduleId);
      return NextResponse.json({ 
        success: false, 
        message: 'No existing content found' 
      }, { status: 404 });
    }

    // JSON content'i parse edip sadece metni al
    const parseContent = (content: any) => {
      console.log('Parsing content type:', typeof content);
      console.log('Content preview:', typeof content === 'string' ? content.substring(0, 100) : 'object');
      
      if (typeof content === 'string') {
        // ```json ile başlayan response'ları temizle
        let cleanContent = content;
        if (content.includes('```json')) {
          cleanContent = content.replace(/```json\s*/, '').replace(/```\s*$/, '');
        }
        
        try {
          // JSON string'i parse et
          const parsed = JSON.parse(cleanContent);
          console.log('Parsed JSON keys:', Object.keys(parsed));
          
          // Eğer content field'ı varsa onu döndür
          if (parsed.content) {
            return parsed.content;
          }
          // Eğer summary field'ı varsa onu döndür (evaluation için)
          if (parsed.summary) {
            return parsed.summary;
          }
          // Eğer taskTitle field'ı varsa JSON string olarak döndür (interactive için)
          if (parsed.taskTitle) {
            return JSON.stringify(parsed);
          }
          // Hiçbiri yoksa raw content'i döndür
          return cleanContent;
        } catch (e) {
          console.log('JSON parse failed:', e.message);
          // JSON parse edilemezse temizlenmiş content'i döndür
          return cleanContent;
        }
      }
      
      // Eğer object ise, content field'ını ara
      if (typeof content === 'object' && content !== null) {
        console.log('Object keys:', Object.keys(content));
        if (content.content) {
          return content.content;
        }
        if (content.summary) {
          return content.summary;
        }
        if (content.taskTitle) {
          return JSON.stringify(content);
        }
      }
      
      return content;
    };

    // Modül içeriklerini frontend'in beklediği formata dönüştür
    const contentPages = moduleContents.map((content: any) => {
      const contentData = content.content_data;
      
      // Content type'a göre format belirle
      let type = 'text';
      let title = '';
      
      switch (content.content_type) {
        case 'introduction':
          type = 'text';
          title = 'Giriş ve Temel Kavramlar';
          break;
        case 'detailed_explanation':
          type = 'text';
          title = 'Detaylı Açıklamalar ve Örnekler';
          break;
        case 'practical_task':
          type = 'interactive';
          title = 'Uygulamalı Örnek ve Pratik';
          break;
        case 'summary_evaluation':
          type = 'evaluation';
          title = 'Özet ve Değerlendirme';
          break;
        default:
          type = 'text';
          title = 'İçerik';
      }

      return {
        id: content.content_type,
        title: title,
        type: type,
        content: parseContent(contentData),
        duration: 15, // Varsayılan süre
        videoSuggestions: contentData?.videoSuggestions || [],
        difficulty: 'beginner', // Varsayılan zorluk
        originalType: content.content_type
      };
    });

    return NextResponse.json({
      success: true,
      moduleId,
      contentPages: contentPages,
      sections: contentPages, // Geriye uyumluluk için
      adaptiveDifficulty: 'beginner'
    });

  } catch (error) {
    console.error('Error getting module content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
