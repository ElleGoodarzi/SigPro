import { NextRequest, NextResponse } from 'next/server';
import { executeOctaveCode } from '@/app/lib/octave-executor';
import { fallbackExecutor } from '@/app/utils/codeExecutor';
import { ApiResponse, CodeExecutionResult } from '@/app/types/api';

export async function POST(request: NextRequest) {
  try {
    const { code, useOctave = true } = await request.json();
    
    if (!code) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: 'Code is required'
      };
      
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Execute the code with Octave if available, or use fallback
    const result: CodeExecutionResult = useOctave 
      ? await executeOctaveCode(code)
      : fallbackExecutor(code);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error executing code:', error);
    
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Failed to execute code',
      details: (error as Error).message
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 