package de.leonso.rest;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.Serializable;
import java.io.StringWriter;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.Map;
import java.util.zip.GZIPOutputStream;

import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;

public class RestApi implements Serializable {
	private static final long serialVersionUID = 1L;

	public static void handleRequest() throws Exception {
		FacesContext context = FacesContext.getCurrentInstance();
		try {
			ExternalContext externalContext = context.getExternalContext();
			HttpServletRequest request = (HttpServletRequest) externalContext.getRequest();
			if (request != null) {
				HttpServletResponse response = (HttpServletResponse) externalContext.getResponse();
				addAllowOriginHeader(request, response);
				if (response != null) {
					Object responseData = null;
					Parameters params = null;
					try {
						params = getParameters(request);
						if ("GET".equals(request.getMethod())) {
							responseData = get(response, params);
						} else {
							throw new Exception("Only http GET is allowed");
						}
						context.responseComplete();
					} catch (Exception e) {
						responseData = e;
					}
					writeResponseData(response, responseData);
				}
			}
		} finally {
			context.responseComplete();
		}
	}

	private static void writeResponseData(HttpServletResponse response, Object data) throws Exception {
		if (data == null) {
			return; // response is already filled
		}
		String jsonData = "";
		if (data instanceof Exception) {
			Exception exception = (Exception) data;
			// exception.printStackTrace();
			JSONObject jsonObject = new JSONObject();
			String message = exception.getMessage().isEmpty() ? exception.toString() : exception.getMessage();
			jsonObject.put("error", message);
			StringWriter stackTrace = new StringWriter();
			exception.printStackTrace(new PrintWriter(stackTrace));
			jsonObject.put("stackTrace", stackTrace.toString().split("\n"));
			response.setStatus(404);
			jsonData = jsonObject.toString();
		} else {
			if (data instanceof String) {
				jsonData = (String) data;
			} else if (data instanceof JSONObject) {
				jsonData = ((JSONObject) data).toString();
			} else if (data instanceof JSONArray) {
				jsonData = ((JSONArray) data).toString();
			}
			response.setStatus(200);
		}
		byte[] bytes = jsonData.getBytes("UTF-8");
		response.setHeader("Content-Type", "application/json; charset=utf-8");
		response.setHeader("Cache-Control", "no-cache");
		response.addHeader("Content-Encoding", "gzip");
		ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
		GZIPOutputStream gzipOutputStream = new GZIPOutputStream(byteArrayOutputStream);
		gzipOutputStream.write(bytes);
		gzipOutputStream.close();
		// calculate gzip content length for "Content-Length" header - saves
		// about 40ms content download time in browser
		response.addHeader("Content-Length", Integer.toString(byteArrayOutputStream.size()));
		OutputStream outStream = response.getOutputStream();
		outStream.write(byteArrayOutputStream.toByteArray());
		outStream.flush();
		outStream.close();
	}

	private static void addAllowOriginHeader(HttpServletRequest request, HttpServletResponse response) {
		String clientOrigin = request.getHeader("origin");
		if (clientOrigin != null && !clientOrigin.isEmpty() && clientOrigin.contains("localhost")) {
			response.addHeader("Access-Control-Allow-Origin", clientOrigin);
			response.addHeader("Access-Control-Allow-Credentials", "true");
			response.addHeader("Access-Control-Allow-Methods", "GET");
			response.addHeader("Access-Control-Expose-Headers", "Content-Type, Content-Range");
			response.addHeader("Access-Control-Max-Age", "86400");
		}
	}

	@SuppressWarnings("unchecked")
	private static Parameters getParameters(HttpServletRequest request) {
		/**
		 * Example for request.getPathInfo(): <br>
		 * /api.xsp/view/myViewname <br>
		 * /api.xsp/id/9A0B20E993C66D2CC1257EC100424710 <br>
		 */
		Parameters params = new Parameters();
		String path = request.getPathInfo();
		try {
			path = URLDecoder.decode(path, "UTF-8");
		} catch (UnsupportedEncodingException ignore) {
			System.out.println("Fehler bei URLDecoder.decode(" + path + ", \"UTF-8\")");
		}
		String[] pathInfo = path.split("/");
		if (pathInfo.length > 1) {
			params.setResource(pathInfo[1]);
		}
		if (pathInfo.length > 2) {
			params.setId(pathInfo[2]);
		}
		if (pathInfo.length > 3) {
			for (int i = 3; i < pathInfo.length; i++) {
				String[] param = pathInfo[i].split("=");
				params.put(param[0], param[param.length - 1]);
			}
		}
		// all other ?...&... parameters
		Map<String, Object> parameterMap = request.getParameterMap();

		for (Map.Entry<String, Object> param : parameterMap.entrySet()) {
			if (param != null) {
				Object paramValue = param.getValue();
				String value = (paramValue instanceof String) ? (String) paramValue : ((String[]) paramValue)[0];
				try {
					value = URLDecoder.decode(value, "UTF-8");
				} catch (UnsupportedEncodingException ignore) {
					System.out.println("Fehler bei URLDecoder.decode(" + value + ", \"UTF-8\")");
				}
				params.put(param.getKey(), value);
			}
		}
		return params;
	}

	private static Object get(HttpServletResponse response, Parameters params) throws Exception {
		if ("view".equals(params.getResource())) {
			return RestView.get(response, params);
		}
		throw new Exception("Unknown Resource: " + params.getResource());
	}

}
