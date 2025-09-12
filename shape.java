 public sealed class shape {
   void draw() {
      System.out.println("inside the shape class");
   }   

      public static void main(String[] args) {
      shape s = new square();
      s.draw();
      square sqr = new square();
      sqr.draw();
      circle cir = new circle();
      cir.draw();
   }

}

final class square extends shape {
   
}

final class circle extends shape {
}





   

