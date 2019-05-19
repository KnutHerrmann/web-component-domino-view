package de.leonso.rest;

import java.util.HashMap;

public class Parameters extends HashMap<String, String> {
	private static final long serialVersionUID = 1L;
	private String resource = "";
	private String id = "";

	public void setId(String id) {
		this.id = id;
	}

	public String getId() {
		return id;
	}

	public void setResource(String resource) {
		this.resource = resource;
	}

	public String getResource() {
		return resource;
	}

	@Override
	public String toString() {
		return "id=" + id + ", resource=" + resource + ", " + super.toString();
	}

}
