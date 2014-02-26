package com.monadpad.doodleme;


import java.io.IOException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.Text;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.Query;

@SuppressWarnings("serial")
public class AnimationHelperServlet extends HttpServlet{

	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
	
		resp.setContentType("text/plain");
	
		DatastoreService ds = DatastoreServiceFactory.getDatastoreService();
	
		String id = req.getParameter("id");
		String type = req.getParameter("type");
		String userid = req.getParameter("userid");
		if (type == null){
			resp.getWriter().print("bad");
		}
		else {
			Query q;
			if (id != null){
				q = new Query(type, KeyFactory.createKey(type, Long.parseLong(id)));
				Entity groove = ds.prepare(q).asSingleEntity();
				if (groove == null){
					resp.getWriter().print("bad") ;
				}
				else{
					resp.getWriter().print(((Text)groove.getProperty("json")).getValue()) ;
				}
			}
			else if (userid != null){
				boolean first = true;
				q = new Query(type);
				q.addFilter("userid", Query.FilterOperator.EQUAL, Long.parseLong(userid));
				resp.getWriter().print("[");
				for (Entity groove : ds.prepare(q).asIterable()){
					if (first){
						first = false;
					}
					else {
						resp.getWriter().print(", \n");
					}
					resp.getWriter().print("{\"id\": \"" + Long.toString(groove.getKey().getId()) + "\", ");
					if (type.equals("Animations"))
						resp.getWriter().print("\"title\": \"" + groove.getProperty("title")+ "\", ");
						
					resp.getWriter().print("\"o\": ") ;
					resp.getWriter().print(((Text)groove.getProperty("json")).getValue()) ;
					resp.getWriter().print("}");
				}
				resp.getWriter().print("]");
			}			
		}
	}

	
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {

		DatastoreService ds = DatastoreServiceFactory.getDatastoreService();

		Entity entity = null;
		String idParameter = req.getParameter("id");
		String type = req.getParameter("type");
		if (type == null){
			resp.getWriter().print("bad");
			return;
		}
		if (idParameter != null){
			Query q = new Query(type, KeyFactory.createKey(type, Long.parseLong(idParameter)));			
			entity = ds.prepare(q).asSingleEntity();			
		}
		if (entity == null){
			entity= new Entity(type);
		}
		entity.setProperty("json", new Text(req.getParameter("json")));
		String userid = req.getParameter("userid");
		if (userid != null){
			entity.setProperty("userid", Long.parseLong(userid));
		}
		
		Key grooveKey = ds.put(entity);
		if (grooveKey != null)
			resp.getWriter().print(Long.toString(grooveKey.getId()));
		else
			resp.getWriter().print("bad");
	}
}
