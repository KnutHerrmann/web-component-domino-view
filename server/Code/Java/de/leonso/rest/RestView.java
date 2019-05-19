package de.leonso.rest;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Vector;

import javax.servlet.http.HttpServletResponse;

import lotus.domino.Database;
import lotus.domino.DateTime;
import lotus.domino.NotesException;
import lotus.domino.Session;
import lotus.domino.View;
import lotus.domino.ViewColumn;
import lotus.domino.ViewEntry;
import lotus.domino.ViewNavigator;

import org.json.JSONArray;
import org.json.JSONObject;

import com.ibm.xsp.extlib.util.ExtLibUtil;

public class RestView {
	private static final String PARAM_ENTRIES = "entries";
	private static final String PARAM_FROM = "from";
	private static final String PARAM_SORT_COLUMN = "sortColumn";
	private static final String PARAM_SORT_DIRECTION = "sortDirection";
	private static final String PARAM_SORT_DIRECTION_DESC = "desc";
	private static final String RESULT_COLUMNS = "columns";
	private static final String RESULT_ROWS = "rows";
	private static final String RESULT_FROM = "from";
	private static final String RESULT_TO = "to";
	private static final String RESULT_TOTAL = "total";
	private static final String ROW_ID = "id";
	private static final String COLUMN_NAME = "name";
	private static final String COLUMN_LABEL = "label";
	private static final String COLUMN_WIDTH = "width";
	private static final String COLUMN_ALIGNMENT = "alignment";
	private static final String COLUMN_ALIGNMENT_LEFT = "left";
	private static final String COLUMN_ALIGNMENT_CENTER = "center";
	private static final String COLUMN_ALIGNMENT_RIGHT = "right";
	private static final String COLUMN_SORTABLE_ASC = "sortasc";
	private static final String COLUMN_SORTABLE_DESC = "sortdesc";

	public static Object get(HttpServletResponse response, Parameters params) throws Exception {
		String nameView = params.getId();
		if (nameView.isEmpty()) {
			throw new Exception("Missing view name in URL.");
		}
		String nameDb = params.containsKey("db") ? params.get("db") : "";
		if (nameDb.isEmpty()) {
			throw new Exception("Missing database path in URL.");
		}
		String nameServer = params.containsKey("server") ? params.get("server") : "";
		JSONObject viewObject = new JSONObject();
		Session session = ExtLibUtil.getCurrentSession();
		Database db = session.getDatabase(nameServer, nameDb);
		View view = db.getView(nameView);
		if (view == null) {
			throw new Exception("View \"" + nameView + "\" not found.");
		}
		view.setAutoUpdate(false);
		JSONArray columns = getViewDefinition(view);
		viewObject.put(RESULT_COLUMNS, columns);
		int entriesRequested = Integer.MAX_VALUE;
		if (params.containsKey(PARAM_ENTRIES)) {
			entriesRequested = Integer.parseInt(params.get(PARAM_ENTRIES));
		}
		int entryStart = 1;
		int entryStop = entriesRequested;
		if (params.containsKey(PARAM_FROM)) {
			entryStart = Integer.parseInt(params.get(PARAM_FROM));
			if (entriesRequested < Integer.MAX_VALUE) {
				entryStop = entryStart + entriesRequested - 1;
			}
		}
		String sortColumn = "";
		if (params.containsKey(PARAM_SORT_COLUMN)) {
			sortColumn = params.get(PARAM_SORT_COLUMN);
		}
		if (!sortColumn.isEmpty()) {
			boolean ascendingFlag = true;
			String sortDirection = params.get(PARAM_SORT_DIRECTION).toLowerCase();
			if (params.containsKey(PARAM_SORT_DIRECTION) && PARAM_SORT_DIRECTION_DESC.equals(sortDirection)) {
				ascendingFlag = false;
			}
			view.resortView(sortColumn, ascendingFlag);
		}

		int total = view.getEntryCount();
		if (entryStart + entriesRequested > total) {
			entryStart = total - entriesRequested + 1;
			if (entryStart < 1) {
				entryStart = 1;
			}
		}
		ViewNavigator nav = null;
		nav = view.createViewNav();
		int count = entryStop - entryStart;
		nav.setBufferMaxEntries(count > 1000 ? 1000 : count);
		nav.setEntryOptions(ViewNavigator.VN_ENTRYOPT_NOCOUNTDATA);

		int entryCurrent = entryStart;
		int entryTo = entryStart;
		ViewEntry entry = entryStart == 1 ? nav.getFirst() : nav.getNth(entryStart);
		JSONArray rows = new JSONArray();
		while (entry != null && entryCurrent <= entryStop && entryCurrent <= total) {
			entry.setPreferJavaDates(true);
			ViewEntry nextEntry = nav.getNext(entry);
			JSONObject row = new JSONObject();
			Vector<?> values = entry.getColumnValues();
			for (int col = 0; col < columns.length() && col < values.size(); col++) {
				JSONObject columnDefinition = (JSONObject) columns.get(col);
				String columnName = (String) columnDefinition.get(COLUMN_NAME);
				row.put(columnName, getColumnValue(values.get(col)));
			}
			row.put(ROW_ID, entry.getUniversalID());
			entryTo = entryCurrent;
			rows.put(row);
			entryCurrent++;
			entry.recycle();
			entry = nextEntry;
		}
		nav.recycle();
		viewObject.put(RESULT_ROWS, rows);
		viewObject.put(RESULT_FROM, entryStart);
		viewObject.put(RESULT_TO, entryTo);
		viewObject.put(RESULT_TOTAL, total);
		return viewObject;
	}

	@SuppressWarnings("unchecked")
	private static Object getColumnValue(Object value) {
		if (value instanceof Vector) {
			Vector vector = (Vector) value;
			if (vector.size() <= 1) {
				if (vector.isEmpty()) {
					return "";
				}
				return getColumnValue(vector.get(0));
			}
			JSONArray objects = new JSONArray();
			for (Object o : vector) {
				objects.put(getColumnValue(o));
			}
			return objects;
		}
		if (value instanceof DateTime) {
			DateTime dateTime = (DateTime) value;
			try {
				return getColumnValue(dateTime.toJavaDate());
			} catch (NotesException ignore) {
			}
		}
		if (value instanceof Date) {
			DateFormat df = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
			return (df.format(value));
		}
		return value;
	}

	private static JSONArray getViewDefinition(View view) throws NotesException {
		JSONArray columns = new JSONArray();
		for (Object colObject : view.getColumns()) {
			ViewColumn column = (ViewColumn) colObject;
			if (column.isHidden()) {
				continue;
			}
			JSONObject columnObject = new JSONObject();
			columnObject.put(COLUMN_NAME, column.getItemName());
			columnObject.put(COLUMN_LABEL, column.getTitle());
			columnObject.put(COLUMN_WIDTH, column.getWidth());
			columnObject.put(COLUMN_ALIGNMENT, //
					column.getAlignment() == 1 ? COLUMN_ALIGNMENT_RIGHT : //
							column.getAlignment() == 2 ? COLUMN_ALIGNMENT_CENTER : //
									COLUMN_ALIGNMENT_LEFT);
			if (column.isResortAscending()) {
				columnObject.put(COLUMN_SORTABLE_ASC, true);
			}
			if (column.isResortDescending()) {
				columnObject.put(COLUMN_SORTABLE_DESC, true);
			}
			columns.put(columnObject);
		}
		return columns;
	}

}
