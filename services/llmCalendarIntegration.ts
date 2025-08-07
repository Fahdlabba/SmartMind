import { calendarTools, calendarToolSchemas } from './calendarTool';


export const llmCalendarTools = {
  add_calendar_event: calendarTools.addEvent,
  get_upcoming_events: calendarTools.getUpcomingEvents,
  create_quick_event: calendarTools.createQuickEvent,
};

export const llmToolSchemas = [
  calendarToolSchemas.addEvent,
  calendarToolSchemas.getUpcomingEvents,
  calendarToolSchemas.createQuickEvent,
];


export async function executeCalendarTool(toolName: string, parameters: any) {
  try {
    // Ensure calendar access before executing any tool
    if (toolName !== 'ensure_access') {
      const accessResult = await calendarTools.ensureAccess();
      if (!accessResult.success) {
        return {
          success: false,
          error: `Calendar access required: ${accessResult.error}`
        };
      }
    }

    switch (toolName) {
      case 'add_calendar_event':
        return await calendarTools.addEvent(parameters);
      
      case 'get_upcoming_events':
        return await calendarTools.getUpcomingEvents(parameters.days);
      
      case 'create_quick_event':
        return await calendarTools.createQuickEvent(parameters);
      
      default:
        return {
          success: false,
          error: `Unknown calendar tool: ${toolName}`
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
