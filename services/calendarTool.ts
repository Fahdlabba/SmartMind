import { calendarService } from './calendar';



export const calendarTools = {
 
  addEvent: async (params: {
    title: string;
    startDate: string; // ISO string format: "2025-08-08T10:00:00.000Z"
    endDate: string; // ISO string format: "2025-08-08T12:00:00.000Z"
    location?: string;
    notes?: string;
    alarmMinutesBefore?: number; // Default: 15 minutes
  }) => {
    return await calendarService.addEventToCalendar(params);
  },


  getUpcomingEvents: async (days: number = 7) => {
    return await calendarService.getUpcomingEventsForLLM(days);
  },

  
  ensureAccess: async () => {
    return await calendarService.ensureCalendarAccess();
  },

 
  createQuickEvent: async (params: {
    title: string;
    date: string; // "today" or "tomorrow" or ISO date string
    time: string; // "10:00" or "14:30"
    durationMinutes?: number; // Default: 60 minutes
    location?: string;
    notes?: string;
  }) => {
    try {
      // Parse the date
      let targetDate: Date;
      if (params.date.toLowerCase() === 'today') {
        targetDate = new Date();
      } else if (params.date.toLowerCase() === 'tomorrow') {
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 1);
      } else {
        targetDate = new Date(params.date);
        if (isNaN(targetDate.getTime())) {
          return {
            success: false,
            error: 'Invalid date. Use "today", "tomorrow", or ISO date string'
          };
        }
      }

      // Parse the time
      const timeMatch = params.time.match(/^(\d{1,2}):(\d{2})$/);
      if (!timeMatch) {
        return {
          success: false,
          error: 'Invalid time format. Use HH:MM format (e.g., "10:00" or "14:30")'
        };
      }

      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return {
          success: false,
          error: 'Invalid time. Hours must be 0-23, minutes must be 0-59'
        };
      }

      // Set the time
      targetDate.setHours(hours, minutes, 0, 0);

      // Calculate end time
      const endDate = new Date(targetDate);
      endDate.setMinutes(endDate.getMinutes() + (params.durationMinutes || 60));

      // Create the event
      return await calendarService.addEventToCalendar({
        title: params.title,
        startDate: targetDate.toISOString(),
        endDate: endDate.toISOString(),
        location: params.location,
        notes: params.notes,
        alarmMinutesBefore: 15
      });

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

// Tool schemas for LLM integration (JSON Schema format)
export const calendarToolSchemas = {
  addEvent: {
    type: "function",
    function: {
      name: "add_calendar_event",
      description: "Add an event to the user's calendar",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Event title"
          },
          startDate: {
            type: "string",
            description: "Event start date and time in ISO format (e.g., '2025-08-08T10:00:00.000Z')"
          },
          endDate: {
            type: "string",
            description: "Event end date and time in ISO format (e.g., '2025-08-08T12:00:00.000Z')"
          },
          location: {
            type: "string",
            description: "Event location (optional)"
          },
          notes: {
            type: "string",
            description: "Event notes or description (optional)"
          },
          alarmMinutesBefore: {
            type: "number",
            description: "Minutes before event to set alarm (default: 15)"
          }
        },
        required: ["title", "startDate", "endDate"]
      }
    }
  },

  getUpcomingEvents: {
    type: "function",
    function: {
      name: "get_upcoming_events",
      description: "Get upcoming events from the user's calendar",
      parameters: {
        type: "object",
        properties: {
          days: {
            type: "number",
            description: "Number of days to look ahead (default: 7)"
          }
        }
      }
    }
  },

  createQuickEvent: {
    type: "function",
    function: {
      name: "create_quick_event",
      description: "Create a quick event for today or tomorrow with simple time input",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Event title"
          },
          date: {
            type: "string",
            description: "Date for the event: 'today', 'tomorrow', or ISO date string"
          },
          time: {
            type: "string",
            description: "Time in HH:MM format (e.g., '10:00' or '14:30')"
          },
          durationMinutes: {
            type: "number",
            description: "Event duration in minutes (default: 60)"
          },
          location: {
            type: "string",
            description: "Event location (optional)"
          },
          notes: {
            type: "string",
            description: "Event notes (optional)"
          }
        },
        required: ["title", "date", "time"]
      }
    }
  }
};
