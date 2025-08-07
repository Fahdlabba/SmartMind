import * as Calendar from 'expo-calendar';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
}

export interface CreateEventOptions {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  alarmMinutesBefore?: number;
}

export class CalendarService {
  private static instance: CalendarService;
  private calendars: Calendar.Calendar[] = [];
  private permissionStatus: string = 'unknown';

  private constructor() {}

  static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  /**
   * Check current calendar permission status
   */
  async checkPermissions(): Promise<string> {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      this.permissionStatus = status;
      console.log('Calendar permission status:', status);
      return status;
    } catch (error) {
      console.error('Error checking calendar permissions:', error);
      throw new Error('Failed to check calendar permissions');
    }
  }

  /**
   * Request calendar permissions from user
   */
  async requestPermissions(): Promise<string> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      this.permissionStatus = status;
      console.log('Calendar permission status after request:', status);
      return status;
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      throw new Error('Failed to request calendar permissions');
    }
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): string {
    return this.permissionStatus;
  }

  /**
   * Load available calendars
   */
  async loadCalendars(): Promise<Calendar.Calendar[]> {
    try {
      const calendarList = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      this.calendars = calendarList;
      console.log('Loaded calendars:', calendarList.length);
      return calendarList;
    } catch (error) {
      console.error('Error loading calendars:', error);
      throw new Error('Failed to load calendars');
    }
  }

  /**
   * Get cached calendars
   */
  getCalendars(): Calendar.Calendar[] {
    return this.calendars;
  }

  /**
   * Get the default calendar or first available calendar
   */
  getDefaultCalendar(): Calendar.Calendar | null {
    if (this.calendars.length === 0) {
      return null;
    }

    // Try to find default or primary calendar
    const defaultCalendar = this.calendars.find(cal => 
      cal.source?.name === 'Default' || 
      cal.isPrimary || 
      cal.allowsModifications
    );

    return defaultCalendar || this.calendars[0];
  }

  /**
   * Fetch events from calendars within a date range
   */
  async fetchEvents(startDate: Date, endDate: Date, calendarIds?: string[]): Promise<Calendar.Event[]> {
    if (this.permissionStatus !== 'granted') {
      throw new Error('Calendar permission not granted');
    }

    try {
      const targetCalendarIds = calendarIds || this.calendars.map(cal => cal.id);
      
      if (targetCalendarIds.length === 0) {
        throw new Error('No calendars available');
      }

      const events = await Calendar.getEventsAsync(
        targetCalendarIds,
        startDate,
        endDate
      );

      console.log(`Fetched ${events.length} events from ${targetCalendarIds.length} calendars`);
      return events;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(options: CreateEventOptions, calendarId?: string): Promise<string> {
    if (this.permissionStatus !== 'granted') {
      throw new Error('Calendar permission not granted');
    }

    try {
      const targetCalendar = calendarId 
        ? this.calendars.find(cal => cal.id === calendarId)
        : this.getDefaultCalendar();

      if (!targetCalendar) {
        throw new Error('No calendar available for creating events');
      }

      const eventConfig: any = {
        title: options.title,
        startDate: options.startDate,
        endDate: options.endDate,
        location: options.location || null,
        notes: options.notes || '',
      };

      // Add alarm if specified
      if (options.alarmMinutesBefore !== undefined) {
        eventConfig.alarms = [{
          relativeOffset: -options.alarmMinutesBefore,
          method: Calendar.AlarmMethod.ALERT,
        }];
      }

      const eventId = await Calendar.createEventAsync(targetCalendar.id, eventConfig);
      console.log('Created event with ID:', eventId);
      return eventId;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(eventId: string, options: Partial<CreateEventOptions>): Promise<void> {
    if (this.permissionStatus !== 'granted') {
      throw new Error('Calendar permission not granted');
    }

    try {
      const updateConfig: Partial<Calendar.Event> = {};

      if (options.title !== undefined) updateConfig.title = options.title;
      if (options.startDate !== undefined) updateConfig.startDate = options.startDate;
      if (options.endDate !== undefined) updateConfig.endDate = options.endDate;
      if (options.location !== undefined) updateConfig.location = options.location;
      if (options.notes !== undefined) updateConfig.notes = options.notes;

      if (options.alarmMinutesBefore !== undefined) {
        updateConfig.alarms = [{
          relativeOffset: -options.alarmMinutesBefore,
          method: Calendar.AlarmMethod.ALERT,
        }];
      }

      await Calendar.updateEventAsync(eventId, updateConfig);
      console.log('Updated event with ID:', eventId);
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    if (this.permissionStatus !== 'granted') {
      throw new Error('Calendar permission not granted');
    }

    try {
      await Calendar.deleteEventAsync(eventId);
      console.log('Deleted event with ID:', eventId);
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  /**
   * Initialize the calendar service (check permissions and load calendars)
   */
  async initialize(): Promise<boolean> {
    try {
      const permissionStatus = await this.checkPermissions();
      
      if (permissionStatus === 'granted') {
        await this.loadCalendars();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error initializing calendar service:', error);
      return false;
    }
  }

  /**
   * Get events for the current month
   */
  async getCurrentMonthEvents(): Promise<Calendar.Event[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    return this.fetchEvents(startOfMonth, endOfMonth);
  }

  /**
   * Get events for the next N days
   */
  async getUpcomingEvents(days: number = 7): Promise<Calendar.Event[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    return this.fetchEvents(startDate, endDate);
  }

  /**
   * Tool function for LLM: Add event to calendar
   * This is the main function that will be exposed as a tool to the LLM
   */
  async addEventToCalendar(params: {
    title: string;
    startDate: string; // ISO string format
    endDate: string; // ISO string format
    location?: string;
    notes?: string;
    alarmMinutesBefore?: number;
  }): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      // Check permissions first
      const permissionStatus = await this.checkPermissions();
      
      if (permissionStatus !== 'granted') {
        // Try to request permissions
        const requestedStatus = await this.requestPermissions();
        if (requestedStatus !== 'granted') {
          return {
            success: false,
            error: 'Calendar permission not granted. Please allow calendar access in device settings.'
          };
        }
      }

      // Load calendars if not already loaded
      if (this.calendars.length === 0) {
        await this.loadCalendars();
      }

      // Validate dates
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return {
          success: false,
          error: 'Invalid date format. Please use ISO date strings (e.g., "2025-08-08T10:00:00.000Z")'
        };
      }

      if (startDate >= endDate) {
        return {
          success: false,
          error: 'Start date must be before end date'
        };
      }

      // Create the event
      const eventId = await this.createEvent({
        title: params.title,
        startDate,
        endDate,
        location: params.location,
        notes: params.notes,
        alarmMinutesBefore: params.alarmMinutesBefore || 15
      });

      return {
        success: true,
        eventId,
      };

    } catch (error) {
      console.error('Error in addEventToCalendar tool:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Tool function for LLM: Get upcoming events
   */
  async getUpcomingEventsForLLM(days: number = 7): Promise<{ 
    success: boolean; 
    events?: Array<{
      id: string;
      title: string;
      startDate: string;
      endDate: string;
      location?: string;
      notes?: string;
    }>; 
    error?: string 
  }> {
    try {
      // Check permissions
      const permissionStatus = await this.checkPermissions();
      if (permissionStatus !== 'granted') {
        return {
          success: false,
          error: 'Calendar permission not granted'
        };
      }

      // Load calendars if needed
      if (this.calendars.length === 0) {
        await this.loadCalendars();
      }

      const events = await this.getUpcomingEvents(days);
      
      return {
        success: true,
        events: events.map(event => ({
          id: event.id,
          title: event.title,
          startDate: event.startDate instanceof Date ? event.startDate.toISOString() : event.startDate,
          endDate: event.endDate instanceof Date ? event.endDate.toISOString() : event.endDate,
          location: event.location || undefined,
          notes: event.notes || undefined,
        }))
      };

    } catch (error) {
      console.error('Error in getUpcomingEventsForLLM tool:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Tool function for LLM: Ensure calendar access
   * Call this before using other calendar tools
   */
  async ensureCalendarAccess(): Promise<{ success: boolean; error?: string; calendarsCount?: number }> {
    try {
      const initialized = await this.initialize();
      
      if (!initialized) {
        // Try to request permissions
        const status = await this.requestPermissions();
        if (status === 'granted') {
          await this.loadCalendars();
          return {
            success: true,
            calendarsCount: this.calendars.length
          };
        } else {
          return {
            success: false,
            error: 'Calendar permission denied by user'
          };
        }
      }

      return {
        success: true,
        calendarsCount: this.calendars.length
      };

    } catch (error) {
      console.error('Error ensuring calendar access:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export singleton instance
export const calendarService = CalendarService.getInstance();